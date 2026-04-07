package com.esprit.microservice_proposal.Services;

import com.esprit.microservice_proposal.DTO.*;
import com.esprit.microservice_proposal.Entity.Proposal;
import com.esprit.microservice_proposal.Entity.ProposalStatus;
import com.esprit.microservice_proposal.Feign.ProjectClient;
import com.esprit.microservice_proposal.Feign.UserClient;
import com.esprit.microservice_proposal.Repository.ProposalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ServiceProposal implements IServiceProposal {

    private final ProposalRepository    proposalRepository;
    private final ProjectClient projectFeignClient;
    private final UserClient userClient;

    @Value("${proposal.expiration.days:14}")
    private int expirationDays;

    // ── CRUD ──────────────────────────────────────────────────────────────────

    @Override
    public Proposal addProposal(Proposal proposal) {
        // Duplicate check
        if (proposalRepository.existsByProjectIdAndFreelancerId(
                proposal.getProjectId(), proposal.getFreelancerId())) {
            throw new RuntimeException("You already submitted a proposal for this project");
        }
        proposal.setStatus(ProposalStatus.PENDING);
        proposal.setCreatedAt(LocalDateTime.now());
        proposal.setExpiresAt(LocalDateTime.now().plusDays(expirationDays));
        return proposalRepository.save(proposal);
    }

    @Override
    public Proposal updateProposal(int id, Proposal newProposal) {
        Proposal existing = proposalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Proposal not found"));

        existing.setProposedPrice(newProposal.getProposedPrice());
        existing.setDeliveryDays(newProposal.getDeliveryDays());
        existing.setCoverLetter(newProposal.getCoverLetter());
        existing.setRevisionsOffered(newProposal.getRevisionsOffered());

        if (newProposal.getStatus() != null)
            existing.setStatus(newProposal.getStatus());

        return proposalRepository.save(existing);
    }

    @Override
    public List<Proposal> getProposals() {
        return proposalRepository.findAll();
    }

    @Override
    public Proposal getProposal(int id) {
        return proposalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Proposal not found"));
    }

    @Override
    public void deleteProposal(int id) {
        if (proposalRepository.existsById(id))
            proposalRepository.deleteById(id);
    }

    @Override
    public List<Proposal> getProposalsByProjectId(int projectId) {
        return proposalRepository.findByProjectId(projectId);
    }

    @Override
    public List<Proposal> getProposalsByFreelancerId(int freelancerId) {
        return proposalRepository.findByFreelancerId(freelancerId);
    }

    // ── FEIGN ─────────────────────────────────────────────────────────────────

    @Override
    public Project getProjectById(int id) {
        return projectFeignClient.getProjectById(id);
    }

    @Override
    public User getFreelancerById(int id) {
        return userClient.getUserById(id);
    }
    @Override
    public List<Project> getAllProjects() {
        return projectFeignClient.getAllProjects();
    }

    // ── STATS ─────────────────────────────────────────────────────────────────

    @Override
    public ProposalStatsDTO getStatsByFreelancer(int freelancerId) {
        List<Proposal> proposals = proposalRepository.findByFreelancerId(freelancerId);

        int total    = proposals.size();
        int accepted = (int) proposals.stream().filter(p -> p.getStatus() == ProposalStatus.ACCEPTED).count();
        int rejected = (int) proposals.stream().filter(p -> p.getStatus() == ProposalStatus.REJECTED).count();
        int pending  = (int) proposals.stream().filter(p -> p.getStatus() == ProposalStatus.PENDING).count();

        double acceptanceRate = total > 0 ? (double) accepted / total : 0;

        double avgPrice = proposals.stream()
                .filter(p -> p.getProposedPrice() != null)
                .mapToDouble(p -> p.getProposedPrice())
                .average().orElse(0);

        double avgDays = proposals.stream()
                .filter(p -> p.getDeliveryDays() != null)
                .mapToDouble(p -> p.getDeliveryDays())
                .average().orElse(0);

        long avgResponseHours = (long) proposals.stream()
                .filter(p -> p.getCreatedAt() != null && p.getExpiresAt() != null)
                .mapToLong(p -> ChronoUnit.HOURS.between(p.getCreatedAt(), p.getExpiresAt()))
                .average().orElse(0);

        return new ProposalStatsDTO(
                freelancerId, total, accepted, rejected, pending,
                acceptanceRate, avgPrice, avgDays, avgResponseHours
        );
    }

    // ── SMART RANKING ─────────────────────────────────────────────────────────

    @Override
    public List<RankedProposalDTO> getRankedProposals(int projectId) {
        List<Proposal> proposals = proposalRepository.findByProjectId(projectId);
        if (proposals.isEmpty()) return List.of();

        // Récupérer le projet pour avoir le budget de référence
        Project project = null;
        try { project = projectFeignClient.getProjectById(projectId); }
        catch (Exception ignored) {}

        final float budgetMid = project != null
                ? ((project.getBudget_min() != null ? project.getBudget_min() : 0)
                + (project.getBudget_max() != null ? project.getBudget_max() : 0)) / 2f
                : 0f;

        // Valeurs max pour normalisation
        float  maxPrice     = (float) proposals.stream().filter(p -> p.getProposedPrice() != null)
                .mapToDouble(p -> p.getProposedPrice()).max().orElse(1);
        int    maxDays      = proposals.stream().filter(p -> p.getDeliveryDays() != null)
                .mapToInt(Proposal::getDeliveryDays).max().orElse(1);
        int    maxRevisions = proposals.stream().filter(p -> p.getRevisionsOffered() != null)
                .mapToInt(Proposal::getRevisionsOffered).max().orElse(1);

        return proposals.stream().map(p -> {
                    // Score prix (40%) : plus proche du budgetMid → meilleur score
                    double priceScore = 0;
                    if (p.getProposedPrice() != null && budgetMid > 0) {
                        double diff = Math.abs(p.getProposedPrice() - budgetMid) / budgetMid;
                        priceScore = Math.max(0, 1 - diff) * 40;
                    }

                    // Score délai (35%) : moins de jours → meilleur score
                    double deliveryScore = 0;
                    if (p.getDeliveryDays() != null && maxDays > 0) {
                        deliveryScore = (1.0 - (double) p.getDeliveryDays() / maxDays) * 35;
                    }

                    // Score révisions (25%) : plus de révisions → meilleur score
                    double revisionScore = 0;
                    if (p.getRevisionsOffered() != null && maxRevisions > 0) {
                        revisionScore = ((double) p.getRevisionsOffered() / maxRevisions) * 25;
                    }

                    double total = priceScore + deliveryScore + revisionScore;
                    p.setRankingScore(total);
                    proposalRepository.save(p);

                    String breakdown = String.format("Price:%.1f | Delivery:%.1f | Revisions:%.1f",
                            priceScore, deliveryScore, revisionScore);

                    return new RankedProposalDTO(p, total, breakdown);
                })
                .sorted(Comparator.comparingDouble(RankedProposalDTO::getScore).reversed())
                .collect(Collectors.toList());
    }

    // ── COUNTER-OFFER ─────────────────────────────────────────────────────────

    @Override
    public Proposal makeCounterOffer(int proposalId, CounterOfferRequest req) {
        Proposal proposal = proposalRepository.findById(proposalId)
                .orElseThrow(() -> new RuntimeException("Proposal not found"));

        if (proposal.getStatus() != ProposalStatus.PENDING) {
            throw new RuntimeException("Counter-offer only allowed on PENDING proposals");
        }

        proposal.setStatus(ProposalStatus.NEGOTIATING);
        proposal.setCounterOfferPrice(req.getCounterPrice());
        proposal.setCounterOfferMessage(req.getMessage());
        proposal.setCounterOfferAt(LocalDateTime.now());

        return proposalRepository.save(proposal);
    }

    @Override
    public Proposal acceptCounterOffer(int proposalId) {
        Proposal proposal = proposalRepository.findById(proposalId)
                .orElseThrow(() -> new RuntimeException("Proposal not found"));

        if (proposal.getStatus() != ProposalStatus.NEGOTIATING) {
            throw new RuntimeException("No counter-offer to accept");
        }

        // Mettre à jour le prix avec celui du counter-offer
        if (proposal.getCounterOfferPrice() != null)
            proposal.setProposedPrice(proposal.getCounterOfferPrice());

        proposal.setStatus(ProposalStatus.ACCEPTED);
        return proposalRepository.save(proposal);
    }

    @Override
    public Proposal rejectCounterOffer(int proposalId) {
        Proposal proposal = proposalRepository.findById(proposalId)
                .orElseThrow(() -> new RuntimeException("Proposal not found"));

        if (proposal.getStatus() != ProposalStatus.NEGOTIATING) {
            throw new RuntimeException("No counter-offer to reject");
        }

        proposal.setStatus(ProposalStatus.REJECTED);
        return proposalRepository.save(proposal);
    }
}