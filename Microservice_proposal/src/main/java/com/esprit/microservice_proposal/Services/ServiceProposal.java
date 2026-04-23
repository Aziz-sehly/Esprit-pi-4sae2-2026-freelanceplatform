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
    @Transactional
    public Proposal rejectProposal(int proposalId, int clientId) {
        Proposal proposal = proposalRepository.findById(proposalId)
                .orElseThrow(() -> new RuntimeException("Proposal not found"));
        proposal.setStatus(ProposalStatus.REJECTED);
        return proposalRepository.save(proposal);
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
    // ServiceProposal.java - Updated acceptProposal method
    public ContractResponse acceptProposal(int proposalId, int clientId) {
        try {
            log.info("Accepting proposal {} for client {}", proposalId, clientId);

            Proposal proposal = getProposal(proposalId);
            proposal.setStatus(ProposalStatus.ACCEPTED);
            proposalRepository.save(proposal);

            // Reject other proposals
            List<Proposal> others = proposalRepository.findByProjectId(proposal.getProjectId());
            for (Proposal other : others) {
                if (!other.getId().equals(proposal.getId())) {
                    other.setStatus(ProposalStatus.REJECTED);
                    proposalRepository.save(other);
                }
            }

            // Update project status
            try {
                projectFeignClient.updateProjectStatus(proposal.getProjectId(), "IN_PROGRESS");
            } catch (Exception e) {
                log.warn("Could not update project status: {}", e.getMessage());
            }

            User client = getUserSafe(clientId);
            User freelancer = getUserSafe(proposal.getFreelancerId());

            // ✅ Build contract with payment structure
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
                    .paymentStructure(proposal.getPaymentStructure().name()) // ✅ Pass payment structure
                    .hourlyRate(proposal.getHourlyRate() != null ?
                            BigDecimal.valueOf(proposal.getHourlyRate()) : null)
                    .estimatedHoursPerWeek(proposal.getEstimatedHoursPerWeek())
                    .milestoneCount(proposal.getMilestoneCount())
                    .milestoneDetails(proposal.getMilestoneDetails())
                    .startDate(LocalDateTime.now())
                    .endDate(LocalDateTime.now().plusDays(proposal.getDeliveryDays()))
                    .description(proposal.getCoverLetter())
                    .build();

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

        int total = proposals.size();
        int accepted = (int) proposals.stream().filter(p -> p.getStatus() == ProposalStatus.ACCEPTED).count();
        int rejected = (int) proposals.stream().filter(p -> p.getStatus() == ProposalStatus.REJECTED).count();
        int pending = (int) proposals.stream().filter(p -> p.getStatus() == ProposalStatus.PENDING).count();

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
        try {
            project = projectFeignClient.getProjectById(projectId);
        } catch (Exception ignored) {
        }

        // Récupérer budget du projet (peut être null)
        final Float budgetMin = project != null ? project.getBudget_min() : null;
        final Float budgetMax = project != null ? project.getBudget_max() : null;

        // Calculer budgetMid seulement si les deux sont définis
        final float budgetMid;
        final boolean hasValidBudget = budgetMin != null && budgetMax != null && budgetMax > 0;

        if (hasValidBudget) {
            budgetMid = (budgetMin + budgetMax) / 2f;
        } else {
            // Si pas de budget défini, utiliser la moyenne des prix proposés
            budgetMid = (float) proposals.stream()
                    .filter(p -> p.getProposedPrice() != null)
                    .mapToDouble(p -> p.getProposedPrice())
                    .average().orElse(0);
        }

        // Trouver min/max pour normalisation
        float minPrice = (float) proposals.stream()
                .filter(p -> p.getProposedPrice() != null)
                .mapToDouble(p -> p.getProposedPrice())
                .min().orElse(0);
        float maxPrice = (float) proposals.stream()
                .filter(p -> p.getProposedPrice() != null)
                .mapToDouble(p -> p.getProposedPrice())
                .max().orElse(0);

        int minDays = proposals.stream()
                .filter(p -> p.getDeliveryDays() != null)
                .mapToInt(Proposal::getDeliveryDays)
                .min().orElse(0);
        int maxDays = proposals.stream()
                .filter(p -> p.getDeliveryDays() != null)
                .mapToInt(Proposal::getDeliveryDays)
                .max().orElse(0);

        int minRevisions = proposals.stream()
                .filter(p -> p.getRevisionsOffered() != null)
                .mapToInt(Proposal::getRevisionsOffered)
                .min().orElse(0);
        int maxRevisions = proposals.stream()
                .filter(p -> p.getRevisionsOffered() != null)
                .mapToInt(Proposal::getRevisionsOffered)
                .max().orElse(0);

        // Ranges pour normalisation
        float priceRange = maxPrice - minPrice;
        int daysRange = maxDays - minDays;
        int revisionsRange = maxRevisions - minRevisions;

        // Budget range pour calcul de différence relative
        float budgetRange = hasValidBudget && budgetMax > budgetMin ? budgetMax - budgetMin : 0;

        return proposals.stream().map(p -> {
                    // Price Score
                    double priceScore = 0;
                    if (p.getProposedPrice() != null && budgetMid > 0) {
                        if (hasValidBudget && budgetRange > 0) {
                            // Normaliser par rapport au range du budget projet
                            double diff = Math.abs(p.getProposedPrice() - budgetMid) / (budgetRange / 2);
                            priceScore = Math.max(0, 1 - Math.min(diff, 1)) * 40;
                        } else {
                            // Pas de budget défini: comparer avec autres propositions
                            if (priceRange > 0) {
                                double normalized = (p.getProposedPrice() - minPrice) / priceRange;
                                // Favoriser prix moyen (ni trop cher ni trop bas)
                                priceScore = (1 - Math.abs(normalized - 0.5) * 2) * 40;
                            } else {
                                priceScore = 20; // Score neutre
                            }
                        }
                    }

                    // Delivery Score: moins de jours = meilleur
                    double deliveryScore = 0;
                    if (p.getDeliveryDays() != null) {
                        if (daysRange > 0) {
                            deliveryScore = (1.0 - (double) (p.getDeliveryDays() - minDays) / daysRange) * 35;
                        } else {
                            deliveryScore = 17.5;
                        }
                    }

                    // Revision Score: plus de révisions = meilleur
                    double revisionScore = 0;
                    if (p.getRevisionsOffered() != null) {
                        if (revisionsRange > 0) {
                            revisionScore = ((double) (p.getRevisionsOffered() - minRevisions) / revisionsRange) * 25;
                        } else {
                            revisionScore = 12.5;
                        }
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
            User user = userClient.getUserById((long) id);
            log.info("Fetched user {}: email={}, name={}", id, user.getEmail(), user.getName());
            return user;
        } catch (FeignException e) {
            log.error("User fetch FAILED for ID {}: status={} body={}",
                    id, e.status(), e.contentUTF8());
            throw new RuntimeException("Cannot fetch user " + id + ": " + e.getMessage());
        }
    }
}