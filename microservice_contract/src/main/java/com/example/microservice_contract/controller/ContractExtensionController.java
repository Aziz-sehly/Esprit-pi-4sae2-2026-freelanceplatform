package com.example.microservice_contract.controller;

import com.example.microservice_contract.dto.ContractExtensionDto;
import com.example.microservice_contract.service.IContractExtensionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/contracts/{contractId}/extensions")
@RequiredArgsConstructor
public class ContractExtensionController {

    private final IContractExtensionService extensionService;

    @PostMapping
    public ResponseEntity<ContractExtensionDto.Response> requestExtension(
            @PathVariable Long contractId,
            @Valid @RequestBody ContractExtensionDto.CreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(extensionService.requestExtension(contractId, request));
    }

    @GetMapping
    public ResponseEntity<List<ContractExtensionDto.Response>> getExtensions(
            @PathVariable Long contractId,
            @RequestParam(required = false, defaultValue = "false") boolean pendingOnly) {
        List<ContractExtensionDto.Response> result = pendingOnly
                ? extensionService.getPendingExtensionsByContract(contractId)
                : extensionService.getExtensionsByContract(contractId);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{extensionId}")
    public ResponseEntity<ContractExtensionDto.Response> getExtension(
            @PathVariable Long contractId,
            @PathVariable Long extensionId) {
        return ResponseEntity.ok(extensionService.getExtensionById(extensionId));
    }

    @PatchMapping("/{extensionId}/review")
    public ResponseEntity<ContractExtensionDto.Response> reviewExtension(
            @PathVariable Long contractId,
            @PathVariable Long extensionId,
            @Valid @RequestBody ContractExtensionDto.ReviewRequest request) {
        return ResponseEntity.ok(extensionService.reviewExtension(extensionId, request));
    }
}