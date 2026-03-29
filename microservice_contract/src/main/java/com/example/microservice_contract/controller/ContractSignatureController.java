package com.example.microservice_contract.controller;

import com.example.microservice_contract.dto.ContractSignatureDto;
import com.example.microservice_contract.service.IContractSignatureService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/contracts/{contractId}/signatures")
@RequiredArgsConstructor
public class ContractSignatureController {

    private final IContractSignatureService signatureService;

    /**
     * POST /api/contracts/{contractId}/signatures
     * Initiate a signature request — creates a token and returns it.
     * You would then send the token to the signer via email/notification.
     */
    @PostMapping
    public ResponseEntity<ContractSignatureDto.Response> initiateSignature(
            @PathVariable Long contractId,
            @Valid @RequestBody ContractSignatureDto.CreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(signatureService.initiateSignature(contractId, request));
    }

    /**
     * POST /api/contracts/{contractId}/signatures/sign
     * Submit the actual signature image using the signing token.
     */
    @PostMapping("/sign")
    public ResponseEntity<ContractSignatureDto.Response> submitSignature(
            @PathVariable Long contractId,
            @Valid @RequestBody ContractSignatureDto.SignRequest request) {
        return ResponseEntity.ok(signatureService.submitSignature(request));
    }

    @GetMapping
    public ResponseEntity<List<ContractSignatureDto.Response>> getSignatures(
            @PathVariable Long contractId) {
        return ResponseEntity.ok(signatureService.getSignaturesByContract(contractId));
    }

    @GetMapping("/{signatureId}")
    public ResponseEntity<ContractSignatureDto.Response> getSignature(
            @PathVariable Long contractId,
            @PathVariable Long signatureId) {
        return ResponseEntity.ok(signatureService.getSignatureById(signatureId));
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Boolean>> isFullySigned(@PathVariable Long contractId) {
        return ResponseEntity.ok(Map.of("fullySigned", signatureService.isFullySigned(contractId)));
    }
}