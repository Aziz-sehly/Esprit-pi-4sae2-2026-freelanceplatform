package com.example.microservice_contract.feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@FeignClient(name = "milestone-service", url = "${milestone.service.url}")
public interface MilestoneClient {

    @PostMapping("/milestone/api/internal/milestones")
    MilestoneResponse createMilestone(@RequestBody MilestoneCreateRequest body);

    @GetMapping("/milestone/api/internal/milestones/contract/{contractId}")
    List<MilestoneFullResponse> getMilestonesByContract(
            @PathVariable("contractId") Long contractId);

    @PatchMapping("/milestone/api/internal/milestones/{id}/extend")
    MilestoneResponse extendMilestone(@PathVariable("id") Long milestoneId,
                                      @RequestBody MilestoneExtendRequest body);

    // ── Records ───────────────────────────────────────────────────────────────

    record MilestoneCreateRequest(
            Long contractId,
            String title,
            String deliverable,
            BigDecimal amount,
            LocalDate dueDate
    ) {}

    record MilestoneExtendRequest(
            LocalDate newDueDate,
            BigDecimal newAmount    // null = keep existing amount
    ) {}

    record MilestoneResponse(
            Long id,
            Long contractId,
            String status
    ) {}

    record MilestoneFullResponse(
            Long id,
            Long contractId,
            String title,
            String deliverable,
            BigDecimal amount,
            LocalDate dueDate,
            String status
    ) {}
}