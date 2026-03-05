package com.prolance.dispute.web;

import com.prolance.dispute.domain.Dispute;
import com.prolance.dispute.domain.DisputeStatus;
import com.prolance.dispute.dto.CreateDisputeRequest;
import com.prolance.dispute.dto.DisputeDetailsResponse;
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
    public Dispute create(@Valid @RequestBody CreateDisputeRequest request) {
        return disputeService.create(request);
    }

    @GetMapping("/{id}")
    public Dispute findById(@PathVariable Long id) {
        return disputeService.findById(id);
    }

    @GetMapping
    public List<Dispute> list(
            @RequestParam(required = false) Long contractId,
            @RequestParam(required = false) DisputeStatus status
    ) {
        return disputeService.list(contractId, status);
    }

    @PatchMapping("/{id}/resolve")
    public Dispute resolve(@PathVariable Long id, @Valid @RequestBody ResolveDisputeRequest request) {
        return disputeService.resolve(id, request);
    }

    @GetMapping("/{id}/details")
    public DisputeDetailsResponse details(@PathVariable Long id) {
        return disputeService.getDetails(id);
    }

    @PutMapping("/{id}")
    public Dispute update(@PathVariable Long id, @Valid @RequestBody UpdateDisputeRequest request,
                         @RequestParam Long currentUserId) {
        return disputeService.update(id, request, currentUserId);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id, @RequestParam Long currentUserId) {
        disputeService.delete(id, currentUserId);
    }

    @PutMapping("/admin/{id}")
    public Dispute adminUpdate(@PathVariable Long id, @Valid @RequestBody UpdateDisputeRequest request) {
        return disputeService.adminUpdate(id, request);
    }

    @DeleteMapping("/admin/{id}")
    public void adminDelete(@PathVariable Long id) {
        disputeService.adminDelete(id);
    }
}
