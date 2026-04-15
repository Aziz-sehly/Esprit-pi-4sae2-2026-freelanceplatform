package com.milestone.milestone.controllers;

import com.milestone.milestone.dto.DisputeCreateRequest;
import com.milestone.milestone.dto.DisputeDecisionRequest;
import com.milestone.milestone.dto.DisputeResponse;
import com.milestone.milestone.models.DisputeStatus;
import com.milestone.milestone.services.DisputeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/disputes")
@RequiredArgsConstructor
public class DisputeController {

    private final DisputeService service;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DisputeResponse create(@RequestBody @Valid DisputeCreateRequest req) {
        return service.create(req);
    }

    @GetMapping
    public List<DisputeResponse> list(
            @RequestParam Long contractId,
            @RequestParam(required = false) DisputeStatus status
    ) {
        return service.list(contractId, status);
    }

    @GetMapping("/blocking")
    public Map<String, Boolean> blocking(@RequestParam Long contractId) {
        return Map.of("blocking", service.hasBlockingDispute(contractId));
    }

    @PatchMapping("/{id}/review")
    public DisputeResponse review(@PathVariable Long id, @RequestBody @Valid DisputeDecisionRequest req) {
        return service.moveToReview(id, req);
    }

    @PatchMapping("/{id}/resolve")
    public DisputeResponse resolve(@PathVariable Long id, @RequestBody @Valid DisputeDecisionRequest req) {
        return service.resolve(id, req);
    }

    @PatchMapping("/{id}/reject")
    public DisputeResponse reject(@PathVariable Long id, @RequestBody @Valid DisputeDecisionRequest req) {
        return service.reject(id, req);
    }
}
