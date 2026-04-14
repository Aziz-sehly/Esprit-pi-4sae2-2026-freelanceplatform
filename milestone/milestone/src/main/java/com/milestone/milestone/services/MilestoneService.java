package com.milestone.milestone.services;

import com.milestone.milestone.dto.MilestoneFeedbackRequest;
import com.milestone.milestone.dto.MilestoneRequest;
import com.milestone.milestone.dto.MilestoneResponse;
import com.milestone.milestone.dto.NotificationMessage;
import com.milestone.milestone.exception.NotFoundException;
import com.milestone.milestone.models.ContractStatus;
import com.milestone.milestone.models.Milestone;
import com.milestone.milestone.models.MilestoneStatus;
import com.milestone.milestone.repositories.ContractRepository;
import com.milestone.milestone.repositories.MilestoneRepository;
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

    public MilestoneResponse create(MilestoneRequest req) {
        ensureContractIsActive(req.contractId());
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
    public MilestoneResponse getById(Long id) {
        return toResponse(repo.findById(id)
                .orElseThrow(() -> new NotFoundException("Milestone not found: " + id)));
    }

    @Transactional(readOnly = true)
    public List<MilestoneResponse> getByContractId(Long contractId) {
        return repo.findByContractId(contractId).stream().map(this::toResponse).toList();
    }

    public MilestoneResponse update(Long id, MilestoneRequest req) {
        ensureContractIsActive(req.contractId());
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

    public void delete(Long id) {
        if (!repo.existsById(id)) {
            throw new NotFoundException("Milestone not found: " + id);
        }
        repo.deleteById(id);
    }

    public MilestoneResponse submit(Long id) {
        Milestone milestone = repo.findById(id)
                .orElseThrow(() -> new NotFoundException("Milestone not found: " + id));

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

    public MilestoneResponse requestRevision(Long id, MilestoneFeedbackRequest req) {
        Milestone milestone = repo.findById(id)
                .orElseThrow(() -> new NotFoundException("Milestone not found: " + id));
        requireStatus(milestone, MilestoneStatus.SUBMITTED, "Only submitted milestones can request revision");

        milestone.setStatus(MilestoneStatus.REVISION_REQUESTED);
        milestone.setRevisionCount(milestone.getRevisionCount() + 1);
        milestone.setLastFeedback(req.feedback());
        touchStatus(milestone);
        Milestone saved = repo.save(milestone);
        notify(saved, "MILESTONE_REVISION_REQUESTED", "Revision requested: " + req.feedback());
        return toResponse(saved);
    }

    public MilestoneResponse approve(Long id) {
        Milestone milestone = repo.findById(id)
                .orElseThrow(() -> new NotFoundException("Milestone not found: " + id));
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

    private void ensureContractIsActive(Long contractId) {
        var contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new NotFoundException("Contract not found: " + contractId));
        if (contract.getStatus() != ContractStatus.ACTIVE) {
            throw new IllegalStateException("Milestones can only be managed inside active contracts");
        }
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
