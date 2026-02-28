package com.milestone.milestone.controllers;

import com.milestone.milestone.dto.MilestoneRequest;
import com.milestone.milestone.dto.MilestoneResponse;
import com.milestone.milestone.services.MilestoneService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class MilestoneController {

    private final MilestoneService service;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MilestoneResponse create(@RequestBody MilestoneRequest req) {
        return service.create(req);
    }

    @GetMapping("/{id}")
    public MilestoneResponse getById(@PathVariable Long id) {
        return service.getById(id);
    }

    @GetMapping
    public List<MilestoneResponse> list(@RequestParam(required = false) Long contractId) {
        if (contractId != null) return service.getByContractId(contractId);
        // if you want “list all”:
        // return service.getAll();
        throw new RuntimeException("contractId is required for now");
    }

    @PutMapping("/{id}")
    public MilestoneResponse update(@PathVariable Long id, @RequestBody MilestoneRequest req) {
        return service.update(id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }

    // Optional fast endpoints
    @PatchMapping("/{id}/approve")
    public MilestoneResponse approve(@PathVariable Long id) {
        return service.approve(id);
    }

    @PostMapping("/{id}/mark-paid")
    public MilestoneResponse markPaid(@PathVariable Long id) {
        return service.markPaid(id);
    }
    @PatchMapping("/{id}/submit")
    public MilestoneResponse submit(@PathVariable Long id) {
        return service.submit(id);
    }
}