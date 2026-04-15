package com.prolance.dispute.web;

import com.prolance.dispute.domain.Dispute;
import com.prolance.dispute.domain.DisputeStatus;
import com.prolance.dispute.dto.AdminDisputeRowDto;
import com.prolance.dispute.dto.CreateDisputeRequest;
import com.prolance.dispute.dto.DisputeDetailsResponse;
import com.prolance.dispute.dto.DisputeInsightsResponse;
import com.prolance.dispute.dto.EvidenceCreateRequest;
import com.prolance.dispute.dto.EvidenceDto;
import com.prolance.dispute.dto.EvidenceMetadataUpdateRequest;
import com.prolance.dispute.dto.EvidenceUpdateRequest;
import com.prolance.dispute.dto.ResolveDisputeRequest;
import com.prolance.dispute.dto.UpdateDisputeRequest;
import com.prolance.dispute.service.DisputeService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/disputes")
public class DisputeController {

    private final DisputeService disputeService;

    public DisputeController(DisputeService disputeService) {
        this.disputeService = disputeService;
    }

    @PostMapping
    public Dispute create(
            @Valid @RequestBody CreateDisputeRequest request,
            @RequestHeader(value = "X-User-Id", required = false) String userIdHeader
    ) {
        return disputeService.create(request, userIdHeader);
    }

    /**
     * Front-office / all authenticated users: only disputes raised by {@code X-User-Id}.
     * Admins no longer get a global list here (they use {@link #listAdmin}).
     */
    @GetMapping
    public List<Dispute> list(
            @RequestParam(required = false) Long contractId,
            @RequestParam(required = false) DisputeStatus status,
            @RequestHeader(value = "X-User-Id", required = false) String userIdHeader
    ) {
        return disputeService.listForUser(contractId, status, userIdHeader);
    }

    /** Back-office: full list (gateway restricts to {@code ROLE_ADMIN}). */
    @GetMapping("/admin")
    public List<AdminDisputeRowDto> listAdmin(
            @RequestParam(required = false) Long contractId,
            @RequestParam(required = false) DisputeStatus status,
            @RequestParam(required = false, defaultValue = "created") String sort
    ) {
        return disputeService.listAdmin(contractId, status, sort);
    }

    @GetMapping("/{id}")
    public Dispute findById(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Id", required = false) String userIdHeader,
            @RequestHeader(value = "X-User-Roles", required = false) String rolesHeader
    ) {
        return disputeService.findByIdForViewer(id, userIdHeader, rolesHeader);
    }

    @PatchMapping("/{id}/resolve")
    public Dispute resolve(
            @PathVariable Long id,
            @Valid @RequestBody ResolveDisputeRequest request,
            @RequestHeader(value = "X-User-Id", required = false) String userIdHeader,
            @RequestHeader(value = "X-User-Roles", required = false) String rolesHeader
    ) {
        return disputeService.resolve(id, request, rolesHeader, userIdHeader);
    }

    @GetMapping("/{id}/details")
    public DisputeDetailsResponse details(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Id", required = false) String userIdHeader,
            @RequestHeader(value = "X-User-Roles", required = false) String rolesHeader
    ) {
        return disputeService.getDetails(id, userIdHeader, rolesHeader);
    }

    @GetMapping("/{id}/insights")
    public DisputeInsightsResponse insights(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Id", required = false) String userIdHeader,
            @RequestHeader(value = "X-User-Roles", required = false) String rolesHeader
    ) {
        return disputeService.getInsights(id, userIdHeader, rolesHeader);
    }

    @GetMapping("/{id}/evidence")
    public List<EvidenceDto> evidence(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Id", required = false) String userIdHeader,
            @RequestHeader(value = "X-User-Roles", required = false) String rolesHeader
    ) {
        return disputeService.listEvidence(id, userIdHeader, rolesHeader);
    }

    @PostMapping("/{id}/evidence")
    public EvidenceDto addEvidence(
            @PathVariable Long id,
            @Valid @RequestBody EvidenceCreateRequest request,
            @RequestHeader(value = "X-User-Id", required = false) String userIdHeader,
            @RequestHeader(value = "X-User-Roles", required = false) String rolesHeader
    ) {
        return disputeService.addEvidence(id, request, userIdHeader, rolesHeader);
    }

    @PatchMapping("/{disputeId}/evidence/{evidenceId}")
    public EvidenceDto adminUpdateEvidenceMetadata(
            @PathVariable Long disputeId,
            @PathVariable Long evidenceId,
            @Valid @RequestBody EvidenceMetadataUpdateRequest request,
            @RequestHeader(value = "X-User-Roles", required = false) String rolesHeader,
            @RequestHeader(value = "X-User-Id", required = false) String userIdHeader
    ) {
        return disputeService.adminUpdateEvidenceMetadata(disputeId, evidenceId, request, rolesHeader, userIdHeader);
    }

    @PutMapping("/{disputeId}/evidence/{evidenceId}")
    public EvidenceDto updateEvidence(
            @PathVariable Long disputeId,
            @PathVariable Long evidenceId,
            @Valid @RequestBody EvidenceUpdateRequest request,
            @RequestHeader(value = "X-User-Id", required = false) String userIdHeader,
            @RequestHeader(value = "X-User-Roles", required = false) String rolesHeader
    ) {
        return disputeService.updateEvidence(disputeId, evidenceId, request, userIdHeader, rolesHeader);
    }

    @DeleteMapping("/{disputeId}/evidence/{evidenceId}")
    public void deleteEvidence(
            @PathVariable Long disputeId,
            @PathVariable Long evidenceId,
            @RequestHeader(value = "X-User-Id", required = false) String userIdHeader,
            @RequestHeader(value = "X-User-Roles", required = false) String rolesHeader
    ) {
        disputeService.deleteEvidence(disputeId, evidenceId, userIdHeader, rolesHeader);
    }

    @PutMapping("/{id}")
    public Dispute update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateDisputeRequest request,
            @RequestParam Long currentUserId,
            @RequestHeader(value = "X-User-Id", required = false) String userIdHeader
    ) {
        return disputeService.update(id, request, currentUserId, userIdHeader);
    }

    @DeleteMapping("/{id}")
    public void delete(
            @PathVariable Long id,
            @RequestParam Long currentUserId,
            @RequestHeader(value = "X-User-Id", required = false) String userIdHeader
    ) {
        disputeService.delete(id, currentUserId, userIdHeader);
    }

    @PutMapping("/admin/{id}")
    public Dispute adminUpdate(@PathVariable Long id, @Valid @RequestBody UpdateDisputeRequest request) {
        return disputeService.adminUpdate(id, request);
    }

    @DeleteMapping("/admin/{id}")
    public void adminDelete(@PathVariable Long id) {
        disputeService.adminDelete(id);
    }

    @GetMapping("/{id}/audit")
    public List<com.prolance.dispute.dto.AuditEventDto> audit(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Id", required = false) String userIdHeader,
            @RequestHeader(value = "X-User-Roles", required = false) String rolesHeader
    ) {
        return disputeService.listAudit(id, userIdHeader, rolesHeader);
    }
}
