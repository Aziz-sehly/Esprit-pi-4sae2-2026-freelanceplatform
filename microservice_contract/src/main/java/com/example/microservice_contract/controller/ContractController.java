package com.example.microservice_contract.controller;

import com.example.microservice_contract.dto.ContractDto;
import com.example.microservice_contract.Enum.ContractStatus;
import com.example.microservice_contract.service.IContractService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/contracts")
@RequiredArgsConstructor
public class ContractController {

    private final IContractService contractService;

    @GetMapping("/ping")
    public ResponseEntity<?> ping() {
        return ResponseEntity.ok(Map.of("status", "OK", "time", LocalDateTime.now()));
    }

    @PostMapping
    public ResponseEntity<ContractDto.Response> createContract(
            @Valid @RequestBody ContractDto.CreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(contractService.createContract(request));
    }

    @GetMapping
    public ResponseEntity<List<ContractDto.Response>> getAll(
            @RequestParam(required = false) ContractStatus status) {
        if (status != null) {
            return ResponseEntity.ok(contractService.getContractsByStatus(status));
        }
        return ResponseEntity.ok(contractService.getAllContracts());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ContractDto.Response> getById(@PathVariable Long id) {
        return ResponseEntity.ok(contractService.getContractById(id));
    }

    @GetMapping("/proposal/{proposalId}")
    public ResponseEntity<ContractDto.Response> getByProposal(@PathVariable Long proposalId) {
        return ResponseEntity.ok(contractService.getContractByProposalId(proposalId));
    }

    @GetMapping("/client/{clientId}")
    public ResponseEntity<List<ContractDto.Response>> getByClient(
            @PathVariable Long clientId,
            @RequestParam(required = false) ContractStatus status) {
        List<ContractDto.Response> result = (status != null)
                ? contractService.getContractsByClientAndStatus(clientId, status)
                : contractService.getContractsByClient(clientId);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/freelancer/{freelancerId}")
    public ResponseEntity<List<ContractDto.Response>> getByFreelancer(
            @PathVariable Long freelancerId,
            @RequestParam(required = false) ContractStatus status) {
        List<ContractDto.Response> result = (status != null)
                ? contractService.getContractsByFreelancerAndStatus(freelancerId, status)
                : contractService.getContractsByFreelancer(freelancerId);
        return ResponseEntity.ok(result);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ContractDto.Response> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody ContractDto.UpdateStatusRequest request) {
        return ResponseEntity.ok(contractService.updateContractStatus(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteContract(@PathVariable Long id) {
        contractService.deleteContract(id);
        return ResponseEntity.noContent().build();
    }
}
