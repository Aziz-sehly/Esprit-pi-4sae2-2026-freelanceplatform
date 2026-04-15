package com.milestone.milestone.services;

import com.milestone.milestone.dto.MilestoneFeedbackRequest;
import com.milestone.milestone.dto.MilestoneRequest;
import com.milestone.milestone.dto.MilestoneResponse;
import com.milestone.milestone.dto.NotificationMessage;
import com.milestone.milestone.exception.NotFoundException;
import com.milestone.milestone.models.Contract;
import com.milestone.milestone.models.ContractStatus;
import com.milestone.milestone.models.Milestone;
import com.milestone.milestone.models.MilestoneStatus;
import com.milestone.milestone.repositories.ContractRepository;
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

    private final MilestoneRepository repo;
    private final ContractRepository contractRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public MilestoneResponse create(MilestoneRequest req, CurrentUser actor) {
        Contract contract = ensureContractIsActive(req.contractId());
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
        Milestone milestone = repo.findById(id)
                .orElseThrow(() -> new NotFoundException("Milestone not found: " + id));
        requireParticipant(loadContract(milestone.getContractId()), actor);
        return toResponse(milestone);
    }

    @Transactional(readOnly = true)
    public List<MilestoneResponse> getByContractId(Long contractId, CurrentUser actor) {
        requireParticipant(loadContract(contractId), actor);
        return repo.findByContractId(contractId).stream().map(this::toResponse).toList();
    }

    public MilestoneResponse update(Long id, MilestoneRequest req, CurrentUser actor) {
        Contract contract = ensureContractIsActive(req.contractId());
        requireClientOwner(contract, actor);

        Milestone milestone = repo.findById(id)
                .orElseThrow(() -> new NotFoundException("Milestone not found: " + id));

        milestone.setContractId(req.contractId());
        milestone.setTitle(req.title());
        milestone.setDeliverable(req.deliverable());
        milestone.setAmount(req.amount());
        milestone.setDueDate(req.dueDate());
        touchStatus(milestone);

        return toResponse(repo.save(milestone));
    }

    public void delete(Long id, CurrentUser actor) {
        Milestone milestone = repo.findById(id)
                .orElseThrow(() -> new NotFoundException("Milestone not found: " + id));
        requireClientOwner(loadContract(milestone.getContractId()), actor);
        repo.deleteById(id);
    }

    public MilestoneResponse submit(Long id, CurrentUser actor) {
        Milestone milestone = repo.findById(id)
                .orElseThrow(() -> new NotFoundException("Milestone not found: " + id));
        requireFreelancerOwner(loadContract(milestone.getContractId()), actor);

        if (milestone.getStatus() == MilestoneStatus.PAID
                || milestone.getStatus() == MilestoneStatus.APPROVED
                || milestone.getStatus() == MilestoneStatus.FUNDED) {
            throw new IllegalStateException("Cannot submit milestone in status: " + milestone.getStatus());
        }

        milestone.setStatus(MilestoneStatus.SUBMITTED);
        milestone.setSubmittedAt(LocalDateTime.now());
        touchStatus(milestone);
        Milestone saved = repo.save(milestone);
        notify(saved, "MILESTONE_SUBMITTED", "Milestone submitted for review");
        return toResponse(saved);
    }

    public MilestoneResponse requestRevision(Long id, MilestoneFeedbackRequest req, CurrentUser actor) {
        Milestone milestone = repo.findById(id)
                .orElseThrow(() -> new NotFoundException("Milestone not found: " + id));
        requireClientOwner(loadContract(milestone.getContractId()), actor);
        requireStatus(milestone, MilestoneStatus.SUBMITTED, "Only submitted milestones can request revision");

        if (req.actorId() != null && !req.actorId().equals(actor.id())) {
            throw new IllegalStateException("Revision actor does not match the authenticated user");
        }

        milestone.setStatus(MilestoneStatus.REVISION_REQUESTED);
        milestone.setRevisionCount(milestone.getRevisionCount() + 1);
        milestone.setLastFeedback(req.feedback());
        touchStatus(milestone);
        Milestone saved = repo.save(milestone);
        notify(saved, "MILESTONE_REVISION_REQUESTED", "Revision requested: " + req.feedback());
        return toResponse(saved);
    }

    public MilestoneResponse approve(Long id, CurrentUser actor) {
        Milestone milestone = repo.findById(id)
                .orElseThrow(() -> new NotFoundException("Milestone not found: " + id));
        requireClientOwner(loadContract(milestone.getContractId()), actor);
        requireStatus(milestone, MilestoneStatus.SUBMITTED, "Only submitted milestones can be approved");

        milestone.setStatus(MilestoneStatus.APPROVED);
        milestone.setClientApprovedAt(LocalDateTime.now());
        touchStatus(milestone);
        Milestone saved = repo.save(milestone);
        notify(saved, "MILESTONE_APPROVED", "Milestone approved");
        return toResponse(saved);
    }

    public MilestoneResponse markFunded(Long id) {
        Milestone milestone = repo.findById(id)
                .orElseThrow(() -> new NotFoundException("Milestone not found: " + id));
        if (milestone.getStatus() != MilestoneStatus.APPROVED && milestone.getStatus() != MilestoneStatus.FUNDED) {
            throw new IllegalStateException("Only approved milestones can be funded");
        }

        milestone.setStatus(MilestoneStatus.FUNDED);
        milestone.setFundedAt(LocalDateTime.now());
        touchStatus(milestone);
        Milestone saved = repo.save(milestone);
        notify(saved, "MILESTONE_FUNDED", "Milestone has been funded");
        return toResponse(saved);
    }

    public MilestoneResponse markPaid(Long id) {
        Milestone milestone = repo.findById(id)
                .orElseThrow(() -> new NotFoundException("Milestone not found: " + id));
        if (milestone.getStatus() != MilestoneStatus.FUNDED && milestone.getStatus() != MilestoneStatus.PAID) {
            throw new IllegalStateException("Only funded milestones can be marked as paid");
        }

        milestone.setStatus(MilestoneStatus.PAID);
        milestone.setPaidAt(LocalDateTime.now());
        touchStatus(milestone);
        Milestone saved = repo.save(milestone);
        notify(saved, "MILESTONE_PAID", "Milestone has been paid");
        return toResponse(saved);
    }

    private MilestoneResponse toResponse(Milestone milestone) {
        return new MilestoneResponse(
                milestone.getId(),
                milestone.getContractId(),
                milestone.getTitle(),
                milestone.getDeliverable(),
                milestone.getAmount(),
                milestone.getDueDate(),
                milestone.getStatus(),
                milestone.getRevisionCount(),
                milestone.getLastFeedback(),
                milestone.getSubmittedAt(),
                milestone.getClientApprovedAt(),
                milestone.getFundedAt(),
                milestone.getPaidAt(),
                milestone.getStatusUpdatedAt(),
                milestone.getCreatedAt()
        );
    }

    private void requireStatus(Milestone milestone, MilestoneStatus expected, String message) {
        if (milestone.getStatus() != expected) {
            throw new IllegalStateException(message + ". Current status: " + milestone.getStatus());
        }
    }

    private void touchStatus(Milestone milestone) {
        milestone.setStatusUpdatedAt(LocalDateTime.now());
    }

    private Contract ensureContractIsActive(Long contractId) {
        Contract contract = loadContract(contractId);
        if (contract.getStatus() != ContractStatus.ACTIVE) {
            throw new IllegalStateException("Milestones can only be managed inside active contracts");
        }
        return contract;
    }

    private Contract loadContract(Long contractId) {
        return contractRepository.findById(contractId)
                .orElseThrow(() -> new NotFoundException("Contract not found: " + contractId));
    }

    private void requireClientOwner(Contract contract, CurrentUser actor) {
        if (!actor.isClient() || !contract.getClientId().equals(actor.id())) {
            throw new IllegalStateException("Only the contract client can perform this action");
        }
    }

    private void requireFreelancerOwner(Contract contract, CurrentUser actor) {
        if (!actor.isFreelancer() || !contract.getFreelancerId().equals(actor.id())) {
            throw new IllegalStateException("Only the assigned freelancer can perform this action");
        }
    }

    private void requireParticipant(Contract contract, CurrentUser actor) {
        if (actor.isAdmin()) {
            return;
        }
        if (actor.isClient() && contract.getClientId().equals(actor.id())) {
            return;
        }
        if (actor.isFreelancer() && contract.getFreelancerId().equals(actor.id())) {
            return;
        }
        throw new IllegalStateException("You do not have access to this milestone");
    }

    private void notify(Milestone milestone, String type, String message) {
        NotificationMessage payload = new NotificationMessage(
                type,
                milestone.getContractId(),
                milestone.getId(),
                null,
                message,
                LocalDateTime.now()
        );
        messagingTemplate.convertAndSend("/topic/notifications", payload);
        messagingTemplate.convertAndSend("/topic/contracts/" + milestone.getContractId(), payload);
    }
}
