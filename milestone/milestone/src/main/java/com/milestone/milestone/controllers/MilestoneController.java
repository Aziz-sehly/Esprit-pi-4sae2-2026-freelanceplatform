package com.milestone.milestone.controllers;

import com.milestone.milestone.dto.MilestoneFeedbackRequest;
import com.milestone.milestone.dto.MilestoneRequest;
import com.milestone.milestone.dto.MilestoneResponse;
import com.milestone.milestone.security.JwtIdentityService;
import com.milestone.milestone.services.MilestoneService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequiredArgsConstructor
public class MilestoneController {

    private final MilestoneService   service;
    private final JwtIdentityService jwtIdentityService;

    // ── Internal endpoint — called by contract service after both parties sign ──
    // No JWT required. Security by obscurity of the path + internal network only.
    @PostMapping("/api/internal/milestones")
    @ResponseStatus(HttpStatus.CREATED)
    public MilestoneResponse createInternal(@RequestBody InternalMilestoneRequest req) {
        return service.createInternal(req);
    }

    // Internal request record — matches MilestoneClient.MilestoneCreateRequest
    public record InternalMilestoneRequest(
            Long contractId,
            String title,
            String deliverable,
            BigDecimal amount,
            LocalDate dueDate
    ) {}

    // ── Standard user-facing endpoints ────────────────────────────────────────

    @PostMapping("/api/milestones")
    @ResponseStatus(HttpStatus.CREATED)
    public MilestoneResponse create(
            @RequestHeader("Authorization") String authorization,
            @RequestBody MilestoneRequest req) {
        return service.create(req, jwtIdentityService.parseRequired(authorization));
    }

    @GetMapping("/api/milestones/{id}")
    public MilestoneResponse getById(
            @RequestHeader("Authorization") String authorization,
            @PathVariable Long id) {
        return service.getById(id, jwtIdentityService.parseRequired(authorization));
    }

    @GetMapping("/api/milestones")
    public List<MilestoneResponse> list(
            @RequestHeader("Authorization") String authorization,
            @RequestParam(required = false) Long contractId) {
        if (contractId != null)
            return service.getByContractId(contractId, jwtIdentityService.parseRequired(authorization));
        throw new RuntimeException("contractId is required");
    }

    @PutMapping("/api/milestones/{id}")
    public MilestoneResponse update(
            @RequestHeader("Authorization") String authorization,
            @PathVariable Long id,
            @RequestBody MilestoneRequest req) {
        return service.update(id, req, jwtIdentityService.parseRequired(authorization));
    }

    @DeleteMapping("/api/milestones/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @RequestHeader("Authorization") String authorization,
            @PathVariable Long id) {
        service.delete(id, jwtIdentityService.parseRequired(authorization));
    }

    @PatchMapping("/api/milestones/{id}/approve")
    public MilestoneResponse approve(
            @RequestHeader("Authorization") String authorization,
            @PathVariable Long id) {
        return service.approve(id, jwtIdentityService.parseRequired(authorization));
    }

    @PatchMapping("/api/milestones/{id}/request-revision")
    public MilestoneResponse requestRevision(
            @RequestHeader("Authorization") String authorization,
            @PathVariable Long id,
            @RequestBody @Valid MilestoneFeedbackRequest req) {
        return service.requestRevision(id, req, jwtIdentityService.parseRequired(authorization));
    }

    @PostMapping("/api/milestones/{id}/mark-funded")
    public MilestoneResponse markFunded(@PathVariable Long id) {
        return service.markFunded(id);
    }

    @PostMapping("/api/milestones/{id}/mark-paid")
    public MilestoneResponse markPaid(@PathVariable Long id) {
        return service.markPaid(id);
    }

    @PatchMapping("/api/milestones/{id}/submit")
    public MilestoneResponse submit(
            @RequestHeader("Authorization") String authorization,
            @PathVariable Long id) {
        return service.submit(id, jwtIdentityService.parseRequired(authorization));
    }

    @GetMapping("/api/internal/milestones/contract/{contractId}")
    public List<MilestoneResponse> getByContractInternal(@PathVariable Long contractId) {
        return service.getByContractIdInternal(contractId);
    }

    // ── Internal: extend a single milestone ───────────────────────────────────
    @PatchMapping("/api/internal/milestones/{id}/extend")
    public MilestoneResponse extendInternal(
            @PathVariable Long id,
            @RequestBody InternalExtendRequest req) {
        return service.extendInternal(id, req);
    }

    public record InternalExtendRequest(
            LocalDate newDueDate,
            BigDecimal newAmount    // null = keep existing amount
    ) {}
}