package com.prolance.dispute.service;

import com.prolance.dispute.client.MediaAnalysisFeignClient;
import com.prolance.dispute.client.MessageClient;
import com.prolance.dispute.domain.Dispute;
import com.prolance.dispute.domain.DisputeStatus;
import com.prolance.dispute.domain.DisputeAuditEvent;
import com.prolance.dispute.dto.AdminDisputeRowDto;
import com.prolance.dispute.dto.CreateDisputeRequest;
import com.prolance.dispute.dto.DisputeDetailsResponse;
import com.prolance.dispute.dto.DisputeInsightsResponse;
import com.prolance.dispute.dto.EvidenceCreateRequest;
import com.prolance.dispute.dto.EvidenceDto;
import com.prolance.dispute.dto.EvidenceMetadataUpdateRequest;
import com.prolance.dispute.dto.EvidenceUpdateRequest;
import com.prolance.dispute.dto.AuditEventDto;
import com.prolance.dispute.dto.MediaEvidenceAnalysisRequestItem;
import com.prolance.dispute.dto.MediaEvidenceAnalysisResult;
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
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

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
    private final DisputeInsightsCalculator insightsCalculator;
    private final MediaAnalysisFeignClient mediaAnalysisFeignClient;

    @Value("${app.dispute.insights.media-analysis-enabled:true}")
    private boolean mediaAnalysisEnabled;

    public DisputeService(DisputeRepository disputeRepository,
                           MessageClient messageClient,
                           EvidenceRepository evidenceRepository,
                           DisputeAuditEventRepository auditRepo,
                           DisputeInsightsCalculator insightsCalculator,
                           MediaAnalysisFeignClient mediaAnalysisFeignClient) {
        this.disputeRepository = disputeRepository;
        this.messageClient = messageClient;
        this.evidenceRepository = evidenceRepository;
        this.auditRepo = auditRepo;
        this.insightsCalculator = insightsCalculator;
        this.mediaAnalysisFeignClient = mediaAnalysisFeignClient;
    }

    /**
     * Litiges encore actifs côté métier : pas résolus / rejetés.
     */
    public boolean hasBlockingDisputeForContract(Long contractId) {
        if (contractId == null) {
            return false;
        }
        return disputeRepository.existsByContractIdAndStatusIn(
                contractId, EnumSet.of(DisputeStatus.OPEN, DisputeStatus.IN_REVIEW));
    }

    public Dispute create(CreateDisputeRequest request, String userIdHeader) {
        Long caller = requireUserId(userIdHeader);
        Long contact = request.getContactUserId();
        if (contact != null && contact.equals(caller)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "contactUserId cannot be the same as creator");
        }
        Dispute dispute = new Dispute();
        dispute.setContractId(request.getContractId());
        dispute.setRaisedByUserId(caller);
        dispute.setContactUserId(contact);
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

    /**
     * Admin back-office list with optional filters and {@link AdminDisputeRowDto#getEscalationScore()}.
     * {@code sort}: {@code escalation} (highest first) or default {@code created} (newest first).
     */
    public List<AdminDisputeRowDto> listAdmin(Long contractId, DisputeStatus status, String sort) {
        List<Dispute> list;
        if (contractId != null && status != null) {
            list = disputeRepository.findByContractId(contractId).stream()
                    .filter(d -> d.getStatus() == status)
                    .toList();
        } else if (contractId != null) {
            list = disputeRepository.findByContractId(contractId);
        } else if (status != null) {
            list = disputeRepository.findByStatus(status);
        } else {
            list = disputeRepository.findAll();
        }
        if (list.isEmpty()) {
            return List.of();
        }
        List<Long> ids = list.stream().map(Dispute::getId).toList();
        Map<Long, Long> evCounts = toLongCountMap(evidenceRepository.countByDisputeIds(ids));
        Map<Long, Long> upCounts = toLongCountMap(auditRepo.countUpdateEventsByDisputeIds(ids));

        List<Dispute> history = disputeRepository.findByStatusIn(List.of(DisputeStatus.RESOLVED, DisputeStatus.REJECTED));
        Map<String, DisputeInsightsCalculator.SlaDistribution> typed = insightsCalculator.buildTypedSlaDistributions(history);
        DisputeInsightsCalculator.SlaDistribution global = insightsCalculator.buildGlobalSlaDistribution(history);

        List<AdminDisputeRowDto> rows = new ArrayList<>(list.size());
        for (Dispute d : list) {
            double sla = insightsCalculator.slaBreachProbability(d, deadlineDays, typed, global);
            int evc = evCounts.getOrDefault(d.getId(), 0L).intValue();
            long upd = upCounts.getOrDefault(d.getId(), 0L);
            double esc = insightsCalculator.escalationScore(d, evc, upd, sla);
            rows.add(new AdminDisputeRowDto(d, round4(esc)));
        }
        Comparator<AdminDisputeRowDto> cmp;
        if ("escalation".equalsIgnoreCase(sort)) {
            cmp = Comparator.comparing(AdminDisputeRowDto::getEscalationScore, Comparator.nullsLast(Double::compareTo)).reversed();
        } else {
            cmp = Comparator.comparing((AdminDisputeRowDto r) -> r.getDispute().getCreatedAt(), Comparator.nullsLast(Comparator.naturalOrder())).reversed();
        }
        rows.sort(cmp);
        return rows;
    }

    private static Map<Long, Long> toLongCountMap(List<Object[]> rows) {
        if (rows == null || rows.isEmpty()) {
            return Map.of();
        }
        Map<Long, Long> m = new HashMap<>();
        for (Object[] o : rows) {
            if (o == null || o.length < 2 || o[0] == null || o[1] == null) continue;
            m.put(((Number) o[0]).longValue(), ((Number) o[1]).longValue());
        }
        return m;
    }

    /** End-user: disputes where caller is creator OR designated contact party. */
    public List<Dispute> listForUser(Long contractId, DisputeStatus status, String userIdHeader) {
        Long uid = requireUserId(userIdHeader);
        Stream<Dispute> stream = disputeRepository.findAll().stream()
                .filter(d -> uid.equals(d.getRaisedByUserId())
                        || (d.getContactUserId() != null && uid.equals(d.getContactUserId())));
        if (contractId != null) {
            stream = stream.filter(d -> contractId.equals(d.getContractId()));
        }
        if (status != null) {
            stream = stream.filter(d -> d.getStatus() == status);
        }
        return stream
                .sorted(Comparator.comparing(Dispute::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder()))
                        .reversed())
                .toList();
    }

    /**
     * Litiges d'un contrat visibles par les deux parties : auteur ou contact désigné à l'ouverture.
     * Remplace l'ancienne liste « tout le contrat » côté milestone tout en restreignant l'accès.
     */
    public List<Dispute> listForContractParticipants(Long contractId, DisputeStatus status, String userIdHeader) {
        Long uid = requireUserId(userIdHeader);
        List<Dispute> list = disputeRepository.findByContractId(contractId);
        Stream<Dispute> stream = list.stream();
        if (status != null) {
            stream = stream.filter(d -> d.getStatus() == status);
        }
        return stream
                .filter(d -> uid.equals(d.getRaisedByUserId())
                        || (d.getContactUserId() != null && uid.equals(d.getContactUserId())))
                .sorted(Comparator.comparing(Dispute::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder()))
                        .reversed())
                .toList();
    }

    /**
     * One-shot maintenance task: populate missing contactUserId using existing disputes
     * from the same contract. Safe to run multiple times.
     */
    public Map<String, Object> backfillMissingContactUsers(String rolesHeader) {
        if (!isGlobalAdmin(rolesHeader)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only administrators can run backfill");
        }

        List<Dispute> all = disputeRepository.findAll();
        if (all.isEmpty()) {
            return Map.of(
                    "totalDisputes", 0,
                    "missingBefore", 0,
                    "updated", 0,
                    "remainingMissing", 0
            );
        }

        Map<Long, List<Dispute>> byContract = new HashMap<>();
        for (Dispute d : all) {
            if (d.getContractId() == null) continue;
            byContract.computeIfAbsent(d.getContractId(), k -> new ArrayList<>()).add(d);
        }

        List<Dispute> changed = new ArrayList<>();
        int missingBefore = 0;
        for (Dispute d : all) {
            if (d.getContactUserId() != null || d.getRaisedByUserId() == null || d.getContractId() == null) {
                continue;
            }
            missingBefore++;
            Long inferred = inferCounterpartyFromContractDisputes(d, byContract.getOrDefault(d.getContractId(), List.of()));
            if (inferred != null && !inferred.equals(d.getRaisedByUserId())) {
                d.setContactUserId(inferred);
                changed.add(d);
            }
        }

        if (!changed.isEmpty()) {
            disputeRepository.saveAll(changed);
            for (Dispute d : changed) {
                recordAudit(d.getId(), "CONTACT_USER_BACKFILLED", null, "contactUserId=" + d.getContactUserId());
            }
        }

        int remaining = 0;
        for (Dispute d : disputeRepository.findAll()) {
            if (d.getContactUserId() == null) remaining++;
        }

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("totalDisputes", all.size());
        res.put("missingBefore", missingBefore);
        res.put("updated", changed.size());
        res.put("remainingMissing", remaining);
        return res;
    }

    private Long inferCounterpartyFromContractDisputes(Dispute target, List<Dispute> sameContract) {
        Long raisedBy = target.getRaisedByUserId();
        if (raisedBy == null) return null;

        // Best case: same creator already has at least one dispute with explicit contact.
        for (Dispute d : sameContract) {
            if (d.getId().equals(target.getId())) continue;
            if (!raisedBy.equals(d.getRaisedByUserId())) continue;
            if (d.getContactUserId() != null && !d.getContactUserId().equals(raisedBy)) {
                return d.getContactUserId();
            }
        }

        // Next best: reverse relation exists (other side dispute points back to this creator).
        for (Dispute d : sameContract) {
            if (d.getId().equals(target.getId())) continue;
            if (d.getContactUserId() == null) continue;
            if (raisedBy.equals(d.getContactUserId()) && d.getRaisedByUserId() != null && !raisedBy.equals(d.getRaisedByUserId())) {
                return d.getRaisedByUserId();
            }
        }

        // Fallback: any explicit contact in same contract that differs from creator.
        for (Dispute d : sameContract) {
            if (d.getId().equals(target.getId())) continue;
            if (d.getContactUserId() != null && !raisedBy.equals(d.getContactUserId())) {
                return d.getContactUserId();
            }
        }
        return null;
    }

    public Dispute findByIdForViewer(Long id, String userIdHeader, String rolesHeader) {
        Dispute dispute = findById(id);
        dispute = autoEscalateIfDeadlineReached(dispute);
        if (isGlobalAdmin(rolesHeader)) {
            return dispute;
        }
        Long uid = requireUserId(userIdHeader);
        boolean isCreator = dispute.getRaisedByUserId() != null && dispute.getRaisedByUserId().equals(uid);
        boolean isContact = dispute.getContactUserId() != null && dispute.getContactUserId().equals(uid);
        if (!isCreator && !isContact) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Only dispute participants can access this dispute"
            );
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

    /** Advanced risk/scoring insights for a specific dispute. */
    public DisputeInsightsResponse getInsights(Long disputeId, String userIdHeader, String rolesHeader) {
        if (!isGlobalAdmin(rolesHeader)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only administrators can access advanced insights");
        }
        Dispute dispute = findByIdForViewer(disputeId, userIdHeader, rolesHeader);
        List<com.prolance.dispute.domain.Evidence> evidences = evidenceRepository.findByDisputeIdOrderByCreatedAtDesc(disputeId);
        List<DisputeAuditEvent> auditEvents = auditRepo.findByDisputeIdOrderByCreatedAtDesc(disputeId);
        List<Dispute> history = disputeRepository.findByStatusIn(List.of(DisputeStatus.RESOLVED, DisputeStatus.REJECTED));
        List<Dispute> sameContract = disputeRepository.findByContractId(dispute.getContractId());
        List<Dispute> raiserHistory = disputeRepository.findByRaisedByUserIdOrderByCreatedAtDesc(dispute.getRaisedByUserId());
        Map<Long, MediaEvidenceAnalysisResult> mediaByEvidence = fetchMediaAnalysis(evidences);
        return insightsCalculator.buildInsights(dispute, evidences, auditEvents, history, sameContract, raiserHistory,
                deadlineDays, mediaByEvidence);
    }

    private Map<Long, MediaEvidenceAnalysisResult> fetchMediaAnalysis(List<com.prolance.dispute.domain.Evidence> evidences) {
        if (!mediaAnalysisEnabled || evidences == null || evidences.isEmpty()) {
            return Map.of();
        }
        List<MediaEvidenceAnalysisRequestItem> req = new ArrayList<>();
        for (com.prolance.dispute.domain.Evidence e : evidences) {
            if (e.getFileUrl() == null || e.getFileUrl().isBlank()) {
                continue;
            }
            MediaEvidenceAnalysisRequestItem it = new MediaEvidenceAnalysisRequestItem();
            it.setEvidenceId(e.getId());
            it.setResourcePath(e.getFileUrl().trim());
            req.add(it);
        }
        if (req.isEmpty()) {
            return Map.of();
        }
        try {
            List<MediaEvidenceAnalysisResult> results = mediaAnalysisFeignClient.analyzeBatch(req);
            if (results == null || results.isEmpty()) {
                return Map.of();
            }
            Map<Long, MediaEvidenceAnalysisResult> map = new HashMap<>();
            for (MediaEvidenceAnalysisResult r : results) {
                if (r != null && r.getEvidenceId() != null) {
                    map.put(r.getEvidenceId(), r);
                }
            }
            return map;
        } catch (Exception ignored) {
            return Map.of();
        }
    }

    private static double round4(double x) {
        return Math.round(x * 10000.0) / 10000.0;
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
                        Boolean.TRUE.equals(e.getAdminLocked()),
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
        evidence.setAdminLocked(false);
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
                isGlobalAdmin(rolesHeader) ? saved.getAdminNote() : null,
                Boolean.TRUE.equals(saved.getAdminLocked()),
                saved.getCreatedAt()
        );
    }

    public EvidenceDto adminUpdateEvidenceMetadata(Long disputeId,
                                                    Long evidenceId,
                                                    EvidenceMetadataUpdateRequest request,
                                                    String rolesHeader,
                                                    String userIdHeader) {
        if (!isGlobalAdmin(rolesHeader)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "ADMIN only");
        }
        Long adminActor = requireUserId(userIdHeader);

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
        evidence.setAdminLocked(true);
        evidenceRepository.save(evidence);

        recordAudit(dispute.getId(), "EVIDENCE_METADATA_UPDATED", adminActor,
                "evidenceId=" + evidence.getId() + ", category=" + evidence.getCategory());

        return new EvidenceDto(
                evidence.getId(),
                evidence.getDisputeId(),
                evidence.getUploaderUserId(),
                evidence.getFileUrl(),
                evidence.getFileName(),
                evidence.getCategory(),
                evidence.getAdminNote(),
                Boolean.TRUE.equals(evidence.getAdminLocked()),
                evidence.getCreatedAt()
        );
    }

    public EvidenceDto updateEvidence(Long disputeId,
                                      Long evidenceId,
                                      EvidenceUpdateRequest request,
                                      String userIdHeader,
                                      String rolesHeader) {
        Dispute dispute = findByIdForViewer(disputeId, userIdHeader, rolesHeader);
        Long actor = requireUserId(userIdHeader);
        boolean admin = isGlobalAdmin(rolesHeader);

        com.prolance.dispute.domain.Evidence evidence = evidenceRepository.findById(evidenceId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Evidence not found"));
        if (!evidence.getDisputeId().equals(dispute.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Evidence does not belong to dispute");
        }
        if (!admin && !actor.equals(evidence.getUploaderUserId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only uploader can update this evidence");
        }
        if (!admin && Boolean.TRUE.equals(evidence.getAdminLocked())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Evidence locked after admin review");
        }

        if (request.getFileUrl() != null && !request.getFileUrl().isBlank()) {
            evidence.setFileUrl(request.getFileUrl().trim());
        }
        if (request.getFileName() != null && !request.getFileName().isBlank()) {
            evidence.setFileName(request.getFileName().trim());
        }
        if (request.getCategory() != null && !request.getCategory().isBlank()) {
            evidence.setCategory(request.getCategory().trim());
        }
        com.prolance.dispute.domain.Evidence saved = evidenceRepository.save(evidence);
        recordAudit(dispute.getId(), "EVIDENCE_UPDATED", actor, "evidenceId=" + saved.getId());
        return new EvidenceDto(
                saved.getId(),
                saved.getDisputeId(),
                saved.getUploaderUserId(),
                saved.getFileUrl(),
                saved.getFileName(),
                saved.getCategory(),
                admin ? saved.getAdminNote() : null,
                Boolean.TRUE.equals(saved.getAdminLocked()),
                saved.getCreatedAt()
        );
    }

    public void deleteEvidence(Long disputeId, Long evidenceId, String userIdHeader, String rolesHeader) {
        Dispute dispute = findByIdForViewer(disputeId, userIdHeader, rolesHeader);
        Long actor = requireUserId(userIdHeader);
        boolean admin = isGlobalAdmin(rolesHeader);

        com.prolance.dispute.domain.Evidence evidence = evidenceRepository.findById(evidenceId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Evidence not found"));
        if (!evidence.getDisputeId().equals(dispute.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Evidence does not belong to dispute");
        }
        boolean ownerOrUploader = actor.equals(evidence.getUploaderUserId()) || actor.equals(dispute.getRaisedByUserId());
        if (!admin && !ownerOrUploader) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only uploader or dispute owner can delete this evidence");
        }
        if (!admin && Boolean.TRUE.equals(evidence.getAdminLocked())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Evidence locked after admin review");
        }

        evidenceRepository.delete(evidence);
        recordAudit(dispute.getId(), "EVIDENCE_DELETED", actor, "evidenceId=" + evidenceId);
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
        if (Boolean.TRUE.equals(request.getRemoveDeadline())) {
            dispute.setDeadlineAt(null);
        } else if (request.getDeadlineAt() != null) {
            if (request.getDeadlineAt().isBefore(dispute.getCreatedAt())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Deadline cannot be before dispute creation time");
            }
            dispute.setDeadlineAt(request.getDeadlineAt());
        }
        Dispute saved = disputeRepository.save(dispute);
        String auditDetails = "type/reason updated; deadlineAt=" + saved.getDeadlineAt();
        recordAudit(saved.getId(), "DISPUTE_UPDATED_ADMIN", null, auditDetails);
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
        boolean admin = isGlobalAdmin(rolesHeader);
        return auditRepo.findByDisputeIdOrderByCreatedAtDesc(disputeId).stream()
                .filter(ev -> admin || !"EVIDENCE_METADATA_UPDATED".equals(ev.getEventType()))
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
