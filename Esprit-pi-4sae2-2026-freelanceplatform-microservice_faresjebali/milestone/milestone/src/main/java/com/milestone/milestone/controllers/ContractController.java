package com.milestone.milestone.controllers;

import com.milestone.milestone.dto.ContractRequest;
import com.milestone.milestone.dto.ContractResponse;
import com.milestone.milestone.models.ContractStatus;
import com.milestone.milestone.security.JwtIdentityService;
import com.milestone.milestone.services.ContractService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/contracts")
@RequiredArgsConstructor
public class ContractController {

    private final ContractService service;
    private final JwtIdentityService jwtIdentityService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ContractResponse create(@RequestHeader("Authorization") String authorization, @RequestBody @Valid ContractRequest req) {
        return service.create(req, jwtIdentityService.parseRequired(authorization));
    }

    @GetMapping("/{id}")
    public ContractResponse getById(@RequestHeader("Authorization") String authorization, @PathVariable Long id) {
        return service.getById(id, jwtIdentityService.parseRequired(authorization));
    }

    @GetMapping
    public List<ContractResponse> list(
            @RequestHeader("Authorization") String authorization,
            @RequestParam(required = false) Long clientId,
            @RequestParam(required = false) Long freelancerId,
            @RequestParam(required = false) ContractStatus status
    ) {
        return service.list(clientId, freelancerId, status, jwtIdentityService.parseRequired(authorization));
    }

    @PutMapping("/{id}")
    public ContractResponse update(@RequestHeader("Authorization") String authorization, @PathVariable Long id, @RequestBody @Valid ContractRequest req) {
        return service.update(id, req, jwtIdentityService.parseRequired(authorization));
    }

    @PatchMapping("/{id}/accept")
    public ContractResponse accept(@RequestHeader("Authorization") String authorization, @PathVariable Long id) {
        return service.accept(id, jwtIdentityService.parseRequired(authorization));
    }

    @PatchMapping("/{id}/reject")
    public ContractResponse reject(@RequestHeader("Authorization") String authorization, @PathVariable Long id) {
        return service.reject(id, jwtIdentityService.parseRequired(authorization));
    }

    @PatchMapping("/{id}/complete")
    public ContractResponse complete(@RequestHeader("Authorization") String authorization, @PathVariable Long id) {
        return service.complete(id, jwtIdentityService.parseRequired(authorization));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@RequestHeader("Authorization") String authorization, @PathVariable Long id) {
        service.delete(id, jwtIdentityService.parseRequired(authorization));
    }
}
