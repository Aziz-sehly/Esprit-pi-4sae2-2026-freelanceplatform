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

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class MilestoneController {

    private final MilestoneService service;
    private final JwtIdentityService jwtIdentityService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MilestoneResponse create(@RequestHeader("Authorization") String authorization, @RequestBody MilestoneRequest req) {
        return service.create(req, jwtIdentityService.parseRequired(authorization));
    }

    @GetMapping("/{id}")
    public MilestoneResponse getById(@RequestHeader("Authorization") String authorization, @PathVariable Long id) {
        return service.getById(id, jwtIdentityService.parseRequired(authorization));
    }

    @GetMapping
    public List<MilestoneResponse> list(@RequestHeader("Authorization") String authorization, @RequestParam(required = false) Long contractId) {
        if (contractId != null) {
            return service.getByContractId(contractId, jwtIdentityService.parseRequired(authorization));
        }
        throw new RuntimeException("contractId is required for now");
    }

    @PutMapping("/{id}")
    public MilestoneResponse update(@RequestHeader("Authorization") String authorization, @PathVariable Long id, @RequestBody MilestoneRequest req) {
        return service.update(id, req, jwtIdentityService.parseRequired(authorization));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@RequestHeader("Authorization") String authorization, @PathVariable Long id) {
        service.delete(id, jwtIdentityService.parseRequired(authorization));
    }

    @PatchMapping("/{id}/approve")
    public MilestoneResponse approve(@RequestHeader("Authorization") String authorization, @PathVariable Long id) {
        return service.approve(id, jwtIdentityService.parseRequired(authorization));
    }

    @PatchMapping("/{id}/request-revision")
    public MilestoneResponse requestRevision(@RequestHeader("Authorization") String authorization, @PathVariable Long id, @RequestBody @Valid MilestoneFeedbackRequest req) {
        return service.requestRevision(id, req, jwtIdentityService.parseRequired(authorization));
    }

    @PostMapping("/{id}/mark-funded")
    public MilestoneResponse markFunded(@PathVariable Long id) {
        return service.markFunded(id);
    }

    @PostMapping("/{id}/mark-paid")
    public MilestoneResponse markPaid(@PathVariable Long id) {
        return service.markPaid(id);
    }

    @PatchMapping("/{id}/submit")
    public MilestoneResponse submit(@RequestHeader("Authorization") String authorization, @PathVariable Long id) {
        return service.submit(id, jwtIdentityService.parseRequired(authorization));
    }
}
