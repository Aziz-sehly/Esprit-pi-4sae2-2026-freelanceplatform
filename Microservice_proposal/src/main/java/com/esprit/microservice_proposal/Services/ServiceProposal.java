package com.esprit.microservice_proposal.Services;

import com.esprit.microservice_proposal.DTO.*;
import com.esprit.microservice_proposal.Entity.Proposal;
import com.esprit.microservice_proposal.Entity.ProposalStatus;
import com.esprit.microservice_proposal.Feign.ContractClient;
import com.esprit.microservice_proposal.Feign.ContractRequest;
import com.esprit.microservice_proposal.Feign.ContractResponse;
import com.esprit.microservice_proposal.Feign.ProjectClient;
import com.esprit.microservice_proposal.Feign.UserClient;
import com.esprit.microservice_proposal.Repository.ProposalRepository;
import feign.FeignException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ServiceProposal implements IServiceProposal {

    private final ProposalRepository proposalRepository;
    private final ProjectClient projectFeignClient;
    private final UserClient userClient;
    private final ContractClient contractClient;

    @Value("${proposal.expiration.days:14}")
    private int expirationDays;

    // ── TESTING FLAG ──────────────────────────────────────────────────────────
    private static final boolean TESTING_MODE = true;
    private static final String  TEST_EMAIL   = "ffaresjebali@gmail.com";

    // ── CRUD ──────────────────────────────────────────────────────────────────

    @Override
    public Proposal addProposal(Proposal proposal) {
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
        return getUserSafe(id);
    }

    @Override
    public List<Project> getAllProjects() {
        return projectFeignClient.getAllProjects();
    }

    // ── ACCEPT PROPOSAL → CREATE CONTRACT ─────────────────────────────────────

    @Override
    @Transactional
    public ContractResponse acceptProposal(int proposalId, int clientId) {
        try {
            log.info("Accepting proposal {} for client {}", proposalId, clientId);

            // Step 1: Mark selected proposal as ACCEPTED
            Proposal proposal = getProposal(proposalId);
            proposal.setStatus(ProposalStatus.ACCEPTED);
            proposalRepository.save(proposal);

            // Step 2: Reject all other proposals for the same project
            List<Proposal> others = proposalRepository.findByProjectId(proposal.getProjectId());
            for (Proposal other : others) {
                if (!other.getId().equals(proposal.getId())) {
                    other.setStatus(ProposalStatus.REJECTED);
                    proposalRepository.save(other);
                }
            }

            // Step 3: Fetch client and freelancer
            User client     = getUserSafe(clientId);
            User freelancer = getUserSafe(proposal.getFreelancerId());

            // Step 4: Testing mode — override emails
            if (TESTING_MODE) {
                log.warn("⚠️  TESTING MODE ON — overriding emails to: {}", TEST_EMAIL);
                client.setEmail(TEST_EMAIL);
                client.setName("Fares (Client)");
                freelancer.setEmail(TEST_EMAIL);
                freelancer.setName("Fares (Freelancer)");
            }

            // Step 5: Build contract request
            ContractRequest contractRequest = ContractRequest.builder()
                    .projectId(Long.valueOf(proposal.getProjectId()))
                    .proposalId(Long.valueOf(proposal.getId()))
                    .freelancerId(Long.valueOf(proposal.getFreelancerId()))
                    .clientId(Long.valueOf(clientId))
                    .clientEmail(client.getEmail())
                    .clientName(client.getName())
                    .freelancerEmail(freelancer.getEmail())
                    .freelancerName(freelancer.getName())
                    .amount(BigDecimal.valueOf(proposal.getProposedPrice()))
                    .platformFeePercentage(BigDecimal.valueOf(10.00))
                    .paymentStructure("FIXED")
                    .startDate(LocalDateTime.now())
                    .endDate(LocalDateTime.now().plusDays(proposal.getDeliveryDays()))
                    .description(proposal.getCoverLetter())
                    .build();

            // Step 6: Call contract microservice
            ContractResponse response = contractClient.createContract(contractRequest);
            log.info("Contract created successfully with ID: {}", response.getId());
            return response;

        } catch (FeignException e) {
            log.error("Feign error: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to create contract: " + e.getMessage());
        } catch (Exception e) {
            log.error("Error accepting proposal: {}", e.getMessage(), e);
            throw new RuntimeException("Error accepting proposal: " + e.getMessage());
        }
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

        Project project = null;
        try { project = projectFeignClient.getProjectById(projectId); }
        catch (Exception ignored) {}

        final float budgetMid = project != null
                ? ((project.getBudget_min() != null ? project.getBudget_min() : 0)
                +  (project.getBudget_max() != null ? project.getBudget_max() : 0)) / 2f
                : 0f;

        float maxPrice     = (float) proposals.stream().filter(p -> p.getProposedPrice() != null)
                .mapToDouble(p -> p.getProposedPrice()).max().orElse(1);
        int   maxDays      = proposals.stream().filter(p -> p.getDeliveryDays() != null)
                .mapToInt(Proposal::getDeliveryDays).max().orElse(1);
        int   maxRevisions = proposals.stream().filter(p -> p.getRevisionsOffered() != null)
                .mapToInt(Proposal::getRevisionsOffered).max().orElse(1);

        return proposals.stream().map(p -> {
                    double priceScore = 0;
                    if (p.getProposedPrice() != null && budgetMid > 0) {
                        double diff = Math.abs(p.getProposedPrice() - budgetMid) / budgetMid;
                        priceScore = Math.max(0, 1 - diff) * 40;
                    }

                    double deliveryScore = 0;
                    if (p.getDeliveryDays() != null && maxDays > 0) {
                        deliveryScore = (1.0 - (double) p.getDeliveryDays() / maxDays) * 35;
                    }

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

        if (proposal.getStatus() != ProposalStatus.PENDING)
            throw new RuntimeException("Counter-offer only allowed on PENDING proposals");

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

        if (proposal.getStatus() != ProposalStatus.NEGOTIATING)
            throw new RuntimeException("No counter-offer to accept");

        if (proposal.getCounterOfferPrice() != null)
            proposal.setProposedPrice(proposal.getCounterOfferPrice());

        proposal.setStatus(ProposalStatus.ACCEPTED);
        return proposalRepository.save(proposal);
    }

    @Override
    public Proposal rejectCounterOffer(int proposalId) {
        Proposal proposal = proposalRepository.findById(proposalId)
                .orElseThrow(() -> new RuntimeException("Proposal not found"));

        if (proposal.getStatus() != ProposalStatus.NEGOTIATING)
            throw new RuntimeException("No counter-offer to reject");

        proposal.setStatus(ProposalStatus.REJECTED);
        return proposalRepository.save(proposal);
    }

    // ── HELPER ────────────────────────────────────────────────────────────────

    private User getUserSafe(int id) {
        try {
            return userClient.getUserById(id);
        } catch (FeignException e) {
            log.warn("User microservice unavailable, returning mock for ID: {}", id);
            return new User(id, "Mock User " + id, "mock" + id + "@email.com", "MOCK_ROLE");
        }
    }
}