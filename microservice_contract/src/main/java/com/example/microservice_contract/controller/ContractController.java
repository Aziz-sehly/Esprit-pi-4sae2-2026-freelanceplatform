package com.example.microservice_contract.controller;

import com.example.microservice_contract.dto.ContractDto;
import com.example.microservice_contract.Enum.ContractStatus;
import com.example.microservice_contract.entity.Contract;
import com.example.microservice_contract.repository.IContractRepository;
import com.example.microservice_contract.service.ContractPdfService;
import com.example.microservice_contract.service.IContractService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/contracts")
@RequiredArgsConstructor
public class ContractController {

    private final IContractService    contractService;
    private final ContractPdfService  pdfService;
    private final IContractRepository contractRepository;

    @GetMapping("/ping")
    public ResponseEntity<?> ping() {
        return ResponseEntity.ok(Map.of("status", "OK", "time", LocalDateTime.now()));
    }

    // Internal — called by proposal microservice (no user JWT needed)
    @PostMapping
    public ResponseEntity<ContractDto.Response> createContract(
            @Valid @RequestBody ContractDto.CreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(contractService.createContract(request));
    }

    // Any authenticated user can list contracts
    @GetMapping
    public ResponseEntity<List<ContractDto.Response>> getAll(
            @RequestParam(required = false) ContractStatus status) {
        return ResponseEntity.ok(status != null
                ? contractService.getContractsByStatus(status)
                : contractService.getAllContracts());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ContractDto.Response> getById(@PathVariable Long id) {
        return ResponseEntity.ok(contractService.getContractById(id));
    }

    @GetMapping("/proposal/{proposalId}")
    public ResponseEntity<ContractDto.Response> getByProposal(@PathVariable Long proposalId) {
        return ResponseEntity.ok(contractService.getContractByProposalId(proposalId));
    }

    // CLIENT can only view their own contracts
    @GetMapping("/client/{clientId}")
    @PreAuthorize("hasAuthority('CLIENT') or hasAuthority('ADMIN')")
    public ResponseEntity<List<ContractDto.Response>> getByClient(
            @PathVariable Long clientId,
            @RequestParam(required = false) ContractStatus status,
            HttpServletRequest request) {

        Long requesterId = (Long) request.getAttribute("userId");
        String role      = (String) request.getAttribute("role");

        if (!"ADMIN".equals(role) && !clientId.equals(requesterId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        return ResponseEntity.ok(status != null
                ? contractService.getContractsByClientAndStatus(clientId, status)
                : contractService.getContractsByClient(clientId));
    }

    // FREELANCER can only view their own contracts
    @GetMapping("/freelancer/{freelancerId}")
    @PreAuthorize("hasAuthority('FREELANCER') or hasAuthority('ADMIN')")
    public ResponseEntity<List<ContractDto.Response>> getByFreelancer(
            @PathVariable Long freelancerId,
            @RequestParam(required = false) ContractStatus status,
            HttpServletRequest request) {

        Long requesterId = (Long) request.getAttribute("userId");
        String role      = (String) request.getAttribute("role");

        if (!"ADMIN".equals(role) && !freelancerId.equals(requesterId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        return ResponseEntity.ok(status != null
                ? contractService.getContractsByFreelancerAndStatus(freelancerId, status)
                : contractService.getContractsByFreelancer(freelancerId));
    }

    // Only ADMIN can manually change status
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<ContractDto.Response> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody ContractDto.UpdateStatusRequest request) {
        return ResponseEntity.ok(contractService.updateContractStatus(id, request));
    }

    // Only ADMIN can delete
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Void> deleteContract(@PathVariable Long id) {
        contractService.deleteContract(id);
        return ResponseEntity.noContent().build();
    }

    // ── PDF ───────────────────────────────────────────────────────────────────
    // Public — accessible from the signing email link without a JWT
    @GetMapping(value = "/{id}/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> downloadPdf(@PathVariable Long id) {
        Contract contract = contractRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Contract not found: " + id));

        byte[] pdf = pdfService.generateContractPdf(contract);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"contract-" + id + ".pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    // ── Verify code (fraud check) ─────────────────────────────────────────────
    @GetMapping("/{id}/verify")
    public ResponseEntity<Map<String, Object>> verifyContract(
            @PathVariable Long id,
            @RequestParam String code) {
        Contract contract = contractRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Contract not found: " + id));

        String expected = pdfService.buildVerificationCode(contract);
        boolean valid   = expected.equals(code.toUpperCase());

        return ResponseEntity.ok(Map.of(
                "contractId", id,
                "valid",      valid,
                "status",     valid ? contract.getStatus().name() : "UNVERIFIED",
                "message",    valid
                        ? "✅ This contract is authentic and was issued by ProLance."
                        : "❌ Verification failed. This document may have been tampered with."
        ));
    }
}