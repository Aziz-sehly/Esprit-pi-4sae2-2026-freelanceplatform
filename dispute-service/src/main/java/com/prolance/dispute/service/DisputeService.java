package com.prolance.dispute.service;

import com.prolance.dispute.client.MessageClient;
import com.prolance.dispute.domain.Dispute;
import com.prolance.dispute.domain.DisputeStatus;
import com.prolance.dispute.domain.DisputeAuditEvent;
import com.prolance.dispute.dto.CreateDisputeRequest;
import com.prolance.dispute.dto.DisputeDetailsResponse;
import com.prolance.dispute.dto.EvidenceCreateRequest;
import com.prolance.dispute.dto.EvidenceDto;
import com.prolance.dispute.dto.EvidenceMetadataUpdateRequest;
import com.prolance.dispute.dto.AuditEventDto;
import com.prolance.dispute.dto.MessageDto;
import com.prolance.dispute.dto.ResolveDisputeRequest;
import com.prolance.dispute.dto.UpdateDisputeRequest;
import com.prolance.dispute.repository.DisputeRepository;
import com.prolance.dispute.repository.EvidenceRepository;
import com.prolance.dispute.repository.DisputeAuditEventRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class DisputeService {

    @Value("${app.dispute.deadline-days:7}")
    private int deadlineDays;

    @Value("${app.dispute.deadline-check-ms:60000}")
    private long deadlineCheckMs;

    private static boolean isGlobalAdmin(String rolesHeader) {
        if (rolesHeader == null || rolesHeader.isBlank()) {
            return false;
        }
        String u = rolesHeader.toUpperCase();
        return u.contains("ROLE_ADMIN");
    }

    private static Long requireUserId(String userIdHeader) {
        if (userIdHeader == null || userIdHeader.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing user identity");
        }
        try {
            return Long.parseLong(userIdHeader.trim());
        } catch (NumberFormatException e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid user identity");
        }
    }

    private final DisputeRepository disputeRepository;
    private final MessageClient messageClient;
    private final EvidenceRepository evidenceRepository;
    private final DisputeAuditEventRepository auditRepo;

    public DisputeService(DisputeRepository disputeRepository,
                           MessageClient messageClient,
                           EvidenceRepository evidenceRepository,
                           DisputeAuditEventRepository auditRepo) {
        this.disputeRepository = disputeRepository;
        this.messageClient = messageClient;
        this.evidenceRepository = evidenceRepository;
        this.auditRepo = auditRepo;
    }

    public Dispute create(CreateDisputeRequest request, String userIdHeader) {
        Long caller = requireUserId(userIdHeader);
        Dispute dispute = new Dispute();
        dispute.setContractId(request.getContractId());
        dispute.setRaisedByUserId(caller);
        dispute.setDisputeType(request.getDisputeType().trim());
        dispute.setReason(request.getReason().trim());
        dispute.setStatus(DisputeStatus.OPEN);
        dispute.setCreatedAt(LocalDateTime.now());
        dispute.setDeadlineAt(dispute.getCreatedAt().plusDays(deadlineDays));
        Dispute saved = disputeRepository.save(dispute);
        recordAudit(saved.getId(), "DISPUTE_CREATED", caller, "deadlineAt=" + saved.getDeadlineAt());
        return saved;
    }

    public Dispute findById(Long id) {
        return disputeRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Dispute not found"));
    }

    /** Full access (admin back-office): optional contract/status filters. */
    public List<Dispute> listAdmin(Long contractId, DisputeStatus status) {
        if (contractId != null) {
            return disputeRepository.findByContractId(contractId);
        }
        if (status != null) {
            return disputeRepository.findByStatus(status);
        }
        return disputeRepository.findAll();
    }

    /** End-user: only disputes raised by the caller (from {@code X-User-Id}). */
    public List<Dispute> listForUser(Long contractId, DisputeStatus status, String userIdHeader) {
        Long uid = requireUserId(userIdHeader);
        if (contractId != null && status != null) {
            return disputeRepository.findByRaisedByUserIdAndContractIdAndStatusOrderByCreatedAtDesc(uid, contractId, status);
        }
        if (contractId != null) {
            return disputeRepository.findByRaisedByUserIdAndContractIdOrderByCreatedAtDesc(uid, contractId);
        }
        if (status != null) {
            return disputeRepository.findByRaisedByUserIdAndStatusOrderByCreatedAtDesc(uid, status);
        }
        return disputeRepository.findByRaisedByUserIdOrderByCreatedAtDesc(uid);
    }

    public Dispute findByIdForViewer(Long id, String userIdHeader, String rolesHeader) {
        Dispute dispute = findById(id);
        dispute = autoEscalateIfDeadlineReached(dispute);
        if (isGlobalAdmin(rolesHeader)) {
            return dispute;
        }
        Long uid = requireUserId(userIdHeader);
        if (!dispute.getRaisedByUserId().equals(uid)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only access your own disputes");
        }
        return dispute;
    }

    private Dispute autoEscalateIfDeadlineReached(Dispute dispute) {
        if (dispute == null) return null;
        if (dispute.getStatus() != DisputeStatus.OPEN) return dispute;
        if (dispute.getDeadlineAt() == null) return dispute;
        if (dispute.getDeadlineAt().isAfter(LocalDateTime.now())) return dispute;

        dispute.setStatus(DisputeStatus.IN_REVIEW);
        Dispute saved = disputeRepository.save(dispute);
        recordAudit(saved.getId(), "ESCALATED_BY_DEADLINE", null, "deadlineAt=" + saved.getDeadlineAt());
        return saved;
    }

    public Dispute resolve(Long disputeId, ResolveDisputeRequest request, String rolesHeader, String userIdHeader) {
        if (!isGlobalAdmin(rolesHeader)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only administrators can resolve disputes");
        }
        Dispute dispute = findById(disputeId);
        Long actor = requireUserId(userIdHeader);
        dispute.setResolvedByUserId(request.getResolvedByUserId());
        dispute.setStatus(request.getStatus());
        dispute.setResolutionType(request.getResolutionType());
        dispute.setResolutionNote(request.getResolutionNote());
        dispute.setRefundAmount(request.getRefundAmount());
        dispute.setResolvedAt(LocalDateTime.now());
        Dispute saved = disputeRepository.save(dispute);
        recordAudit(saved.getId(), "DISPUTE_RESOLVED", actor,
                "status=" + saved.getStatus() + ", resolutionType=" + saved.getResolutionType());
        return saved;
    }

    public DisputeDetailsResponse getDetails(Long disputeId, String userIdHeader, String rolesHeader) {
        Dispute dispute = findByIdForViewer(disputeId, userIdHeader, rolesHeader);
        List<MessageDto> relatedMessages = messageClient.getMessagesByContractId(dispute.getContractId());
        return new DisputeDetailsResponse(dispute, relatedMessages);
    }

    /** Evidence access is restricted by the same rule as dispute viewing. */
    public List<EvidenceDto> listEvidence(Long disputeId, String userIdHeader, String rolesHeader) {
        // Throws 403/404 if not allowed
        findByIdForViewer(disputeId, userIdHeader, rolesHeader);
        return evidenceRepository.findByDisputeIdOrderByCreatedAtDesc(disputeId).stream()
                .map(e -> new EvidenceDto(
                        e.getId(),
                        e.getDisputeId(),
                        e.getUploaderUserId(),
                        e.getFileUrl(),
                        e.getFileName(),
                        e.getCategory(),
                        // adminNote only for admin users
                        isGlobalAdmin(rolesHeader) ? e.getAdminNote() : null,
                        e.getCreatedAt()
                ))
                .toList();
    }

    public EvidenceDto addEvidence(Long disputeId, EvidenceCreateRequest request, String userIdHeader, String rolesHeader) {
        Dispute dispute = findByIdForViewer(disputeId, userIdHeader, rolesHeader);
        Long uploader = requireUserId(userIdHeader);
        EvidenceCreateRequest safe = request;

        com.prolance.dispute.domain.Evidence evidence = new com.prolance.dispute.domain.Evidence();
        evidence.setDisputeId(dispute.getId());
        evidence.setUploaderUserId(uploader);
        evidence.setFileUrl(safe.getFileUrl().trim());
        evidence.setFileName(safe.getFileName().trim());
        evidence.setCategory(safe.getCategory() != null && !safe.getCategory().isBlank()
                ? safe.getCategory().trim()
                : "OTHER");
        evidence.setAdminNote(null);
        evidence.setCreatedAt(LocalDateTime.now());
        com.prolance.dispute.domain.Evidence saved = evidenceRepository.save(evidence);
        recordAudit(saved.getDisputeId(), "EVIDENCE_ADDED", uploader,
                "fileName=" + saved.getFileName() + ", category=" + saved.getCategory());
        return new EvidenceDto(
                saved.getId(),
                saved.getDisputeId(),
                saved.getUploaderUserId(),
                saved.getFileUrl(),
                saved.getFileName(),
                saved.getCategory(),
                saved.getAdminNote(),
                saved.getCreatedAt()
        );
    }

    public EvidenceDto adminUpdateEvidenceMetadata(Long disputeId,
                                                    Long evidenceId,
                                                    EvidenceMetadataUpdateRequest request,
                                                    String rolesHeader) {
        if (!isGlobalAdmin(rolesHeader)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "ADMIN only");
        }

        Dispute dispute = findById(disputeId);

        com.prolance.dispute.domain.Evidence evidence = evidenceRepository.findById(evidenceId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Evidence not found"));
        if (!evidence.getDisputeId().equals(dispute.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Evidence does not belong to dispute");
        }

        evidence.setCategory(request.getCategory() != null && !request.getCategory().isBlank()
                ? request.getCategory().trim()
                : evidence.getCategory());
        evidence.setAdminNote(request.getAdminNote());
        evidenceRepository.save(evidence);

        // For admin actor, we can only log uploaderUserId if we don't have X-User-Id here.
        // Controller provides rolesHeader only; keep actor null.
        recordAudit(dispute.getId(), "EVIDENCE_METADATA_UPDATED", null,
                "evidenceId=" + evidence.getId() + ", category=" + evidence.getCategory());

        return new EvidenceDto(
                evidence.getId(),
                evidence.getDisputeId(),
                evidence.getUploaderUserId(),
                evidence.getFileUrl(),
                evidence.getFileName(),
                evidence.getCategory(),
                evidence.getAdminNote(),
                evidence.getCreatedAt()
        );
    }

    /** User updates their own dispute (only when OPEN). {@code currentUserId} must match {@code X-User-Id}. */
    public Dispute update(Long id, UpdateDisputeRequest request, Long currentUserId, String userIdHeader) {
        Long caller = requireUserId(userIdHeader);
        if (!caller.equals(currentUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "User id mismatch");
        }
        Dispute dispute = findById(id);
        if (!dispute.getRaisedByUserId().equals(currentUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only edit disputes you created");
        }
        if (dispute.getStatus() != DisputeStatus.OPEN) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Can only edit disputes with status OPEN");
        }
        dispute.setDisputeType(request.getDisputeType().trim());
        dispute.setReason(request.getReason().trim());
        Dispute saved = disputeRepository.save(dispute);
        recordAudit(saved.getId(), "DISPUTE_UPDATED", caller, "reason updated");
        return saved;
    }

    /** Admin updates any dispute */
    public Dispute adminUpdate(Long id, UpdateDisputeRequest request) {
        Dispute dispute = findById(id);
        dispute.setDisputeType(request.getDisputeType().trim());
        dispute.setReason(request.getReason().trim());
        Dispute saved = disputeRepository.save(dispute);
        recordAudit(saved.getId(), "DISPUTE_UPDATED_ADMIN", null, "reason updated");
        return saved;
    }

    /** User deletes their own dispute (only when OPEN). {@code currentUserId} must match {@code X-User-Id}. */
    public void delete(Long id, Long currentUserId, String userIdHeader) {
        Long caller = requireUserId(userIdHeader);
        if (!caller.equals(currentUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "User id mismatch");
        }
        Dispute dispute = findById(id);
        if (!dispute.getRaisedByUserId().equals(currentUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only delete disputes you created");
        }
        if (dispute.getStatus() != DisputeStatus.OPEN) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Can only delete disputes with status OPEN");
        }
        disputeRepository.delete(dispute);
        recordAudit(dispute.getId(), "DISPUTE_DELETED", caller, null);
    }

    /** Admin deletes any dispute */
    public void adminDelete(Long id) {
        Dispute dispute = findById(id);
        disputeRepository.delete(dispute);
        recordAudit(dispute.getId(), "DISPUTE_DELETED_ADMIN", null, null);
    }

    public List<AuditEventDto> listAudit(Long disputeId, String userIdHeader, String rolesHeader) {
        findByIdForViewer(disputeId, userIdHeader, rolesHeader);
        return auditRepo.findByDisputeIdOrderByCreatedAtDesc(disputeId).stream()
                .map(ev -> new AuditEventDto(ev.getEventType(), ev.getActorUserId(), ev.getDetails(), ev.getCreatedAt()))
                .toList();
    }

    private void recordAudit(Long disputeId, String eventType, Long actorUserId, String details) {
        try {
            DisputeAuditEvent ev = new DisputeAuditEvent();
            ev.setDisputeId(disputeId);
            ev.setEventType(eventType);
            ev.setActorUserId(actorUserId);
            ev.setDetails(details);
            ev.setCreatedAt(LocalDateTime.now());
            auditRepo.save(ev);
        } catch (Exception ignored) {
            // Audit should not break business logic.
        }
    }

    @Scheduled(fixedDelayString = "${app.dispute.deadline-check-ms:60000}")
    public void escalateExpiredDisputes() {
        LocalDateTime now = LocalDateTime.now();
        List<Dispute> expired = disputeRepository.findByStatusAndDeadlineAtIsNotNullAndDeadlineAtLessThanEqual(DisputeStatus.OPEN, now);
        if (expired == null || expired.isEmpty()) return;

        for (Dispute d : expired) {
            if (d.getDeadlineAt() == null) continue;
            d.setStatus(DisputeStatus.IN_REVIEW);
            disputeRepository.save(d);
            recordAudit(d.getId(), "ESCALATED_BY_DEADLINE", null, "deadlineAt=" + d.getDeadlineAt());
        }
    }
}
