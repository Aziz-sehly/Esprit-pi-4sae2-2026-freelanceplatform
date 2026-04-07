package com.example.microservice_contract.controller;

import com.example.microservice_contract.dto.ContractExtensionDto;
import com.example.microservice_contract.service.IContractExtensionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/contracts/{contractId}/extensions")
@RequiredArgsConstructor
public class ContractExtensionController {

    private final IContractExtensionService extensionService;

    // Both CLIENT and FREELANCER can request an extension
    @PreAuthorize("hasAuthority('CLIENT') or hasAuthority('FREELANCER')")
    @PostMapping
    public ResponseEntity<ContractExtensionDto.Response> requestExtension(
            @PathVariable Long contractId,
            @Valid @RequestBody ContractExtensionDto.CreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(extensionService.requestExtension(contractId, request));
    }

    // Both parties can view extensions
    @GetMapping
    public ResponseEntity<List<ContractExtensionDto.Response>> getExtensions(
            @PathVariable Long contractId,
            @RequestParam(required = false, defaultValue = "false") boolean pendingOnly) {
        return ResponseEntity.ok(pendingOnly
                ? extensionService.getPendingExtensionsByContract(contractId)
                : extensionService.getExtensionsByContract(contractId));
    }

    @GetMapping("/{extensionId}")
    public ResponseEntity<ContractExtensionDto.Response> getExtension(
            @PathVariable Long contractId,
            @PathVariable Long extensionId) {
        return ResponseEntity.ok(extensionService.getExtensionById(extensionId));
    }

    // Only the OTHER party reviews (if CLIENT requested, FREELANCER reviews and vice versa)
    // We enforce this at the service level via requestingParty in the extension itself
    @PreAuthorize("hasAuthority('CLIENT') or hasAuthority('FREELANCER')")
    @PatchMapping("/{extensionId}/review")
    public ResponseEntity<ContractExtensionDto.Response> reviewExtension(
            @PathVariable Long contractId,
            @PathVariable Long extensionId,
            @Valid @RequestBody ContractExtensionDto.ReviewRequest request) {
        return ResponseEntity.ok(extensionService.reviewExtension(extensionId, request));
    }
}