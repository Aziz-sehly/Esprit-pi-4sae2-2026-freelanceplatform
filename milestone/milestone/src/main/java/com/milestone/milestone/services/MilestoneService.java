package com.milestone.milestone.services;

import com.milestone.milestone.controllers.MilestoneController.InternalMilestoneRequest;
import com.milestone.milestone.dto.MilestoneFeedbackRequest;
import com.milestone.milestone.dto.MilestoneRequest;
import com.milestone.milestone.dto.MilestoneResponse;
import com.milestone.milestone.dto.NotificationMessage;
import com.milestone.milestone.exception.NotFoundException;
import com.milestone.milestone.feign.ContractClient;
import com.milestone.milestone.models.Milestone;
import com.milestone.milestone.models.MilestoneStatus;
import com.milestone.milestone.repositories.MilestoneRepository;
import com.milestone.milestone.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class MilestoneService {

    private final MilestoneRepository    repo;
    private final ContractClient         contractClient;   // Feign — replaces ContractRepository
    private final SimpMessagingTemplate  messagingTemplate;

    // ── Internal creation — called by contract service after activation ────────

    public MilestoneResponse createInternal(InternalMilestoneRequest req) {
        Milestone milestone = Milestone.builder()
                .contractId(req.contractId())
                .title(req.title())
                .deliverable(req.deliverable())
                .amount(req.amount())
                .dueDate(req.dueDate())
                .status(MilestoneStatus.PENDING)
                .revisionCount(0)
                .build();

        Milestone saved = repo.save(milestone);
        notify(saved, "MILESTONE_CREATED", "Milestone auto-created: " + saved.getTitle());
        return toResponse(saved);
    }

    // ── Standard operations ───────────────────────────────────────────────────

    public MilestoneResponse create(MilestoneRequest req, CurrentUser actor) {
        ContractClient.ContractDto contract = ensureContractIsActive(req.contractId());
        requireClientOwner(contract, actor);

        Milestone milestone = Milestone.builder()
                .contractId(req.contractId())
                .title(req.title())
                .deliverable(req.deliverable())
                .amount(req.amount())
                .dueDate(req.dueDate())
                .status(MilestoneStatus.PENDING)
                .revisionCount(0)
                .build();

        Milestone saved = repo.save(milestone);
        notify(saved, "MILESTONE_CREATED", "New milestone created: " + saved.getTitle());
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public MilestoneResponse getById(Long id, CurrentUser actor) {
        Milestone milestone = findOrThrow(id);
        requireParticipant(loadContract(milestone.getContractId()), actor);
        return toResponse(milestone);
    }

    @Transactional(readOnly = true)
    public List<MilestoneResponse> getByContractId(Long contractId, CurrentUser actor) {
        requireParticipant(loadContract(contractId), actor);
        return repo.findByContractId(contractId).stream().map(this::toResponse).toList();
    }

    public MilestoneResponse update(Long id, MilestoneRequest req, CurrentUser actor) {
        ContractClient.ContractDto contract = ensureContractIsActive(req.contractId());
        requireClientOwner(contract, actor);

        Milestone milestone = findOrThrow(id);
        milestone.setContractId(req.contractId());
        milestone.setTitle(req.title());
        milestone.setDeliverable(req.deliverable());
        milestone.setAmount(req.amount());
        milestone.setDueDate(req.dueDate());
        touchStatus(milestone);

        return toResponse(repo.save(milestone));
    }

    public void delete(Long id, CurrentUser actor) {
        Milestone milestone = findOrThrow(id);
        requireClientOwner(loadContract(milestone.getContractId()), actor);
        repo.deleteById(id);
    }

    public MilestoneResponse submit(Long id, CurrentUser actor) {
        Milestone milestone = findOrThrow(id);
        requireFreelancerOwner(loadContract(milestone.getContractId()), actor);

        if (milestone.getStatus() == MilestoneStatus.PAID
                || milestone.getStatus() == MilestoneStatus.APPROVED
                || milestone.getStatus() == MilestoneStatus.FUNDED) {
            throw new IllegalStateException(
                    "Cannot submit milestone in status: " + milestone.getStatus());
        }

        milestone.setStatus(MilestoneStatus.SUBMITTED);
        milestone.setSubmittedAt(LocalDateTime.now());
        touchStatus(milestone);
        Milestone saved = repo.save(milestone);
        notify(saved, "MILESTONE_SUBMITTED", "Milestone submitted for review");
        return toResponse(saved);
    }

    public MilestoneResponse requestRevision(Long id, MilestoneFeedbackRequest req,
                                             CurrentUser actor) {
        Milestone milestone = findOrThrow(id);
        requireClientOwner(loadContract(milestone.getContractId()), actor);
        requireStatus(milestone, MilestoneStatus.SUBMITTED,
                "Only submitted milestones can request revision");

        if (req.actorId() != null && !req.actorId().equals(actor.id()))
            throw new IllegalStateException(
                    "Revision actor does not match the authenticated user");

        milestone.setStatus(MilestoneStatus.REVISION_REQUESTED);
        milestone.setRevisionCount(milestone.getRevisionCount() + 1);
        milestone.setLastFeedback(req.feedback());
        touchStatus(milestone);
        Milestone saved = repo.save(milestone);
        notify(saved, "MILESTONE_REVISION_REQUESTED", "Revision requested: " + req.feedback());
        return toResponse(saved);
    }

    public MilestoneResponse approve(Long id, CurrentUser actor) {
        Milestone milestone = findOrThrow(id);
        requireClientOwner(loadContract(milestone.getContractId()), actor);
        requireStatus(milestone, MilestoneStatus.SUBMITTED,
                "Only submitted milestones can be approved");

        milestone.setStatus(MilestoneStatus.APPROVED);
        milestone.setClientApprovedAt(LocalDateTime.now());
        touchStatus(milestone);
        Milestone saved = repo.save(milestone);
        notify(saved, "MILESTONE_APPROVED", "Milestone approved");
        return toResponse(saved);
    }

    public MilestoneResponse markFunded(Long id) {
        Milestone milestone = findOrThrow(id);
        if (milestone.getStatus() != MilestoneStatus.APPROVED
                && milestone.getStatus() != MilestoneStatus.FUNDED)
            throw new IllegalStateException("Only approved milestones can be funded");

        milestone.setStatus(MilestoneStatus.FUNDED);
        milestone.setFundedAt(LocalDateTime.now());
        touchStatus(milestone);
        Milestone saved = repo.save(milestone);
        notify(saved, "MILESTONE_FUNDED", "Milestone has been funded");
        return toResponse(saved);
    }

    public MilestoneResponse markPaid(Long id) {
        Milestone milestone = findOrThrow(id);
        if (milestone.getStatus() != MilestoneStatus.FUNDED
                && milestone.getStatus() != MilestoneStatus.PAID)
            throw new IllegalStateException("Only funded milestones can be marked as paid");

        milestone.setStatus(MilestoneStatus.PAID);
        milestone.setPaidAt(LocalDateTime.now());
        touchStatus(milestone);
        Milestone saved = repo.save(milestone);
        notify(saved, "MILESTONE_PAID", "Milestone has been paid");
        return toResponse(saved);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Milestone findOrThrow(Long id) {
        return repo.findById(id)
                .orElseThrow(() -> new NotFoundException("Milestone not found: " + id));
    }

    private ContractClient.ContractDto loadContract(Long contractId) {
        try {
            return contractClient.getById(contractId);
        } catch (Exception e) {
            throw new NotFoundException("Contract not found: " + contractId);
        }
    }

    private ContractClient.ContractDto ensureContractIsActive(Long contractId) {
        ContractClient.ContractDto contract = loadContract(contractId);
        if (!"ACTIVE".equals(contract.status()))
            throw new IllegalStateException(
                    "Milestones can only be managed inside active contracts");
        return contract;
    }

    private void requireClientOwner(ContractClient.ContractDto contract, CurrentUser actor) {
        if (!actor.isClient() || !contract.clientId().equals(actor.id()))
            throw new IllegalStateException(
                    "Only the contract client can perform this action");
    }

    private void requireFreelancerOwner(ContractClient.ContractDto contract, CurrentUser actor) {
        if (!actor.isFreelancer() || !contract.freelancerId().equals(actor.id()))
            throw new IllegalStateException(
                    "Only the assigned freelancer can perform this action");
    }

    private void requireParticipant(ContractClient.ContractDto contract, CurrentUser actor) {
        if (actor.isAdmin()) return;
        if (actor.isClient()     && contract.clientId().equals(actor.id()))     return;
        if (actor.isFreelancer() && contract.freelancerId().equals(actor.id())) return;
        throw new IllegalStateException("You do not have access to this milestone");
    }

    private void requireStatus(Milestone milestone, MilestoneStatus expected, String message) {
        if (milestone.getStatus() != expected)
            throw new IllegalStateException(
                    message + ". Current status: " + milestone.getStatus());
    }

    private void touchStatus(Milestone milestone) {
        milestone.setStatusUpdatedAt(LocalDateTime.now());
    }

    private MilestoneResponse toResponse(Milestone m) {
        return new MilestoneResponse(
                m.getId(), m.getContractId(), m.getTitle(), m.getDeliverable(),
                m.getAmount(), m.getDueDate(), m.getStatus(), m.getRevisionCount(),
                m.getLastFeedback(), m.getSubmittedAt(), m.getClientApprovedAt(),
                m.getFundedAt(), m.getPaidAt(), m.getStatusUpdatedAt(), m.getCreatedAt());
    }

    private void notify(Milestone milestone, String type, String message) {
        NotificationMessage payload = new NotificationMessage(
                type, milestone.getContractId(), milestone.getId(),
                null, message, LocalDateTime.now());
        messagingTemplate.convertAndSend("/topic/notifications", payload);
        messagingTemplate.convertAndSend(
                "/topic/contracts/" + milestone.getContractId(), payload);
    }

    // ── Internal: list all milestones for a contract (no auth check) ───────────
    @Transactional(readOnly = true)
    public List<MilestoneResponse> getByContractIdInternal(Long contractId) {
        return repo.findByContractId(contractId)
                .stream().map(this::toResponse).toList();
    }

    // ── Internal: extend milestone due date and/or amount ─────────────────────
    public MilestoneResponse extendInternal(Long id,
                                            MilestoneController.InternalExtendRequest req) {

        Milestone milestone = findOrThrow(id);

        if (req.newDueDate() != null)
            milestone.setDueDate(req.newDueDate());

        // Only update amount if explicitly provided — null means "no change"
        if (req.newAmount() != null)
            milestone.setAmount(req.newAmount());

        touchStatus(milestone);
        Milestone saved = repo.save(milestone);

        notify(saved, "MILESTONE_EXTENDED",
                "Due date → " + saved.getDueDate()
                        + (req.newAmount() != null
                        ? ", amount → " + saved.getAmount()
                        : " (amount unchanged)"));

        return toResponse(saved);
    }
}