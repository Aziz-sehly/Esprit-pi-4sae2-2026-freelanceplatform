package com.milestone.milestone.controllers;

import com.milestone.milestone.dto.ContractRequest;
import com.milestone.milestone.dto.ContractResponse;
import com.milestone.milestone.models.ContractStatus;
import com.milestone.milestone.services.ContractService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/contracts")
@RequiredArgsConstructor
public class ContractController {

    private final ContractService service;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ContractResponse create(@RequestBody @Valid ContractRequest req) {
        return service.create(req);
    }

    @GetMapping("/{id}")
    public ContractResponse getById(@PathVariable Long id) {
        return service.getById(id);
    }

    @GetMapping
    public List<ContractResponse> list(
            @RequestParam(required = false) Long clientId,
            @RequestParam(required = false) Long freelancerId,
            @RequestParam(required = false) ContractStatus status
    ) {
        return service.list(clientId, freelancerId, status);
    }

    @PutMapping("/{id}")
    public ContractResponse update(@PathVariable Long id, @RequestBody @Valid ContractRequest req) {
        return service.update(id, req);
    }

    @PatchMapping("/{id}/accept")
    public ContractResponse accept(@PathVariable Long id) {
        return service.accept(id);
    }

    @PatchMapping("/{id}/reject")
    public ContractResponse reject(@PathVariable Long id) {
        return service.reject(id);
    }

    @PatchMapping("/{id}/complete")
    public ContractResponse complete(@PathVariable Long id) {
        return service.complete(id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
