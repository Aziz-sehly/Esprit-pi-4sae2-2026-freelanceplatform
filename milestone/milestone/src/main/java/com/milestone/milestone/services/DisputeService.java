package com.milestone.milestone.services;

import com.milestone.milestone.dto.DisputeCreateRequest;
import com.milestone.milestone.dto.DisputeDecisionRequest;
import com.milestone.milestone.dto.DisputeResponse;
import com.milestone.milestone.dto.NotificationMessage;
import com.milestone.milestone.exception.NotFoundException;
import com.milestone.milestone.models.Contract;
import com.milestone.milestone.models.ContractDispute;
import com.milestone.milestone.models.ContractStatus;
import com.milestone.milestone.models.DisputeStatus;
import com.milestone.milestone.models.MessageSenderRole;
import com.milestone.milestone.repositories.ContractDisputeRepository;
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
public class DisputeService {

    private final ContractDisputeRepository disputeRepository;
    private final ContractRepository contractRepository;
    private final MilestoneRepository milestoneRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public DisputeResponse create(DisputeCreateRequest req) {
        Contract contract = findContract(req.contractId());
        ensureDisputeAllowed(contract);
        validateParticipant(contract, req.openedById(), req.openedByRole(), req.openedByName());
        validateMilestone(contract.getId(), req.milestoneId());

        ContractDispute dispute = ContractDispute.builder()
                .contractId(req.contractId())
                .milestoneId(req.milestoneId())
                .paymentId(req.paymentId())
                .reason(req.reason())
                .status(DisputeStatus.OPEN)
                .openedByRole(req.openedByRole())
                .openedById(req.openedById())
                .openedByName(req.openedByName().trim())
                .title(req.title().trim())
                .description(req.description().trim())
                .build();

        DisputeResponse response = toResponse(disputeRepository.save(dispute));
        notify(response, "DISPUTE_OPENED", req.openedByName() + " opened a dispute: " + req.title());
        return response;
    }

    @Transactional(readOnly = true)
    public List<DisputeResponse> list(Long contractId, DisputeStatus status) {
        findContract(contractId);
        List<ContractDispute> disputes = status == null
                ? disputeRepository.findByContractIdOrderByUpdatedAtDesc(contractId)
                : disputeRepository.findByContractIdAndStatusOrderByUpdatedAtDesc(contractId, status);
        return disputes.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public boolean hasBlockingDispute(Long contractId) {
        findContract(contractId);
        return disputeRepository.existsByContractIdAndStatusIn(contractId, List.of(DisputeStatus.OPEN, DisputeStatus.UNDER_REVIEW));
    }

    public DisputeResponse moveToReview(Long id, DisputeDecisionRequest req) {
        ContractDispute dispute = findDispute(id);
        if (dispute.getStatus() != DisputeStatus.OPEN) {
            throw new IllegalStateException("Only open disputes can move to review");
        }

        dispute.setStatus(DisputeStatus.UNDER_REVIEW);
        dispute.setResolutionNote(req.note().trim());
        DisputeResponse response = toResponse(disputeRepository.save(dispute));
        notify(response, "DISPUTE_UNDER_REVIEW", "Dispute is now under review");
        return response;
    }

    public DisputeResponse resolve(Long id, DisputeDecisionRequest req) {
        ContractDispute dispute = findDispute(id);
        if (dispute.getStatus() == DisputeStatus.RESOLVED || dispute.getStatus() == DisputeStatus.REJECTED) {
            throw new IllegalStateException("This dispute is already closed");
        }

        dispute.setStatus(DisputeStatus.RESOLVED);
        dispute.setResolutionNote(req.note().trim());
        dispute.setResolvedAt(LocalDateTime.now());
        DisputeResponse response = toResponse(disputeRepository.save(dispute));
        notify(response, "DISPUTE_RESOLVED", "Dispute resolved");
        return response;
    }

    public DisputeResponse reject(Long id, DisputeDecisionRequest req) {
        ContractDispute dispute = findDispute(id);
        if (dispute.getStatus() == DisputeStatus.RESOLVED || dispute.getStatus() == DisputeStatus.REJECTED) {
            throw new IllegalStateException("This dispute is already closed");
        }

        dispute.setStatus(DisputeStatus.REJECTED);
        dispute.setResolutionNote(req.note().trim());
        dispute.setResolvedAt(LocalDateTime.now());
        DisputeResponse response = toResponse(disputeRepository.save(dispute));
        notify(response, "DISPUTE_REJECTED", "Dispute rejected");
        return response;
    }

    private Contract findContract(Long contractId) {
        return contractRepository.findById(contractId)
                .orElseThrow(() -> new NotFoundException("Contract not found: " + contractId));
    }

    private ContractDispute findDispute(Long id) {
        return disputeRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Dispute not found: " + id));
    }

    private void ensureDisputeAllowed(Contract contract) {
        if (contract.getStatus() == ContractStatus.CANCELLED || contract.getStatus() == ContractStatus.REJECTED) {
            throw new IllegalStateException("Disputes cannot be created for inactive contracts");
        }
    }

    private void validateParticipant(Contract contract, Long actorId, MessageSenderRole role, String actorName) {
        boolean valid = switch (role) {
            case CLIENT -> contract.getClientId().equals(actorId) && contract.getClientName().equals(actorName);
            case FREELANCER -> contract.getFreelancerId().equals(actorId) && contract.getFreelancerName().equals(actorName);
        };

        if (!valid) {
            throw new IllegalStateException("Dispute actor does not match the contract participants");
        }
    }

    private void validateMilestone(Long contractId, Long milestoneId) {
        if (milestoneId == null) {
            return;
        }

        var milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new NotFoundException("Milestone not found: " + milestoneId));
        if (!milestone.getContractId().equals(contractId)) {
            throw new IllegalStateException("Milestone does not belong to the contract");
        }
    }

    private DisputeResponse toResponse(ContractDispute dispute) {
        return new DisputeResponse(
                dispute.getId(),
                dispute.getContractId(),
                dispute.getMilestoneId(),
                dispute.getPaymentId(),
                dispute.getReason(),
                dispute.getStatus(),
                dispute.getOpenedByRole(),
                dispute.getOpenedById(),
                dispute.getOpenedByName(),
                dispute.getTitle(),
                dispute.getDescription(),
                dispute.getResolutionNote(),
                dispute.getCreatedAt(),
                dispute.getUpdatedAt(),
                dispute.getResolvedAt()
        );
    }

    private void notify(DisputeResponse dispute, String type, String message) {
        NotificationMessage payload = new NotificationMessage(
                type,
                dispute.contractId(),
                dispute.milestoneId(),
                dispute.paymentId(),
                message,
                LocalDateTime.now()
        );
        messagingTemplate.convertAndSend("/topic/notifications", payload);
        messagingTemplate.convertAndSend("/topic/contracts/" + dispute.contractId(), payload);
    }
}
