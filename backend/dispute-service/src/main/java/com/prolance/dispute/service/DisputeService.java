package com.prolance.dispute.service;

import com.prolance.dispute.client.MessageClient;
import com.prolance.dispute.domain.Dispute;
import com.prolance.dispute.domain.DisputeStatus;
import com.prolance.dispute.dto.CreateDisputeRequest;
import com.prolance.dispute.dto.DisputeDetailsResponse;
import com.prolance.dispute.dto.MessageDto;
import com.prolance.dispute.dto.ResolveDisputeRequest;
import com.prolance.dispute.dto.UpdateDisputeRequest;
import com.prolance.dispute.repository.DisputeRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class DisputeService {

    private final DisputeRepository disputeRepository;
    private final MessageClient messageClient;

    public DisputeService(DisputeRepository disputeRepository, MessageClient messageClient) {
        this.disputeRepository = disputeRepository;
        this.messageClient = messageClient;
    }

    public Dispute create(CreateDisputeRequest request) {
        Dispute dispute = new Dispute();
        dispute.setContractId(request.getContractId());
        dispute.setRaisedByUserId(request.getRaisedByUserId());
        dispute.setDisputeType(request.getDisputeType().trim());
        dispute.setReason(request.getReason().trim());
        dispute.setStatus(DisputeStatus.OPEN);
        dispute.setCreatedAt(LocalDateTime.now());
        return disputeRepository.save(dispute);
    }

    public Dispute findById(Long id) {
        return disputeRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Dispute not found"));
    }

    public List<Dispute> list(Long contractId, DisputeStatus status) {
        if (contractId != null) {
            return disputeRepository.findByContractId(contractId);
        }
        if (status != null) {
            return disputeRepository.findByStatus(status);
        }
        return disputeRepository.findAll();
    }

    public Dispute resolve(Long disputeId, ResolveDisputeRequest request) {
        Dispute dispute = findById(disputeId);
        dispute.setResolvedByUserId(request.getResolvedByUserId());
        dispute.setStatus(request.getStatus());
        dispute.setResolutionType(request.getResolutionType());
        dispute.setResolutionNote(request.getResolutionNote());
        dispute.setRefundAmount(request.getRefundAmount());
        dispute.setResolvedAt(LocalDateTime.now());
        return disputeRepository.save(dispute);
    }

    public DisputeDetailsResponse getDetails(Long disputeId) {
        Dispute dispute = findById(disputeId);
        List<MessageDto> relatedMessages = messageClient.getMessagesByContractId(dispute.getContractId());
        return new DisputeDetailsResponse(dispute, relatedMessages);
    }

    /** User updates their own dispute (only when OPEN) */
    public Dispute update(Long id, UpdateDisputeRequest request, Long currentUserId) {
        Dispute dispute = findById(id);
        if (!dispute.getRaisedByUserId().equals(currentUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only edit disputes you created");
        }
        if (dispute.getStatus() != DisputeStatus.OPEN) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Can only edit disputes with status OPEN");
        }
        dispute.setDisputeType(request.getDisputeType().trim());
        dispute.setReason(request.getReason().trim());
        return disputeRepository.save(dispute);
    }

    /** Admin updates any dispute */
    public Dispute adminUpdate(Long id, UpdateDisputeRequest request) {
        Dispute dispute = findById(id);
        dispute.setDisputeType(request.getDisputeType().trim());
        dispute.setReason(request.getReason().trim());
        return disputeRepository.save(dispute);
    }

    /** User deletes their own dispute (only when OPEN) */
    public void delete(Long id, Long currentUserId) {
        Dispute dispute = findById(id);
        if (!dispute.getRaisedByUserId().equals(currentUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only delete disputes you created");
        }
        if (dispute.getStatus() != DisputeStatus.OPEN) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Can only delete disputes with status OPEN");
        }
        disputeRepository.delete(dispute);
    }

    /** Admin deletes any dispute */
    public void adminDelete(Long id) {
        Dispute dispute = findById(id);
        disputeRepository.delete(dispute);
    }
}
