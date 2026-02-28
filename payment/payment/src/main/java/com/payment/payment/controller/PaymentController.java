package com.payment.payment.controller;


import com.payment.payment.dto.PaymentRequest;
import com.payment.payment.dto.PaymentResponse;
import com.payment.payment.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService service;

    @PostMapping("/payments")
    @ResponseStatus(HttpStatus.CREATED)
    public PaymentResponse create(@RequestBody @Valid PaymentRequest req) {
        return service.create(req);
    }

    @GetMapping("/payments/{id}")
    public PaymentResponse getById(@PathVariable Long id) {
        return service.getById(id);
    }

    // filter: /payments?contractId=1 OR /payments?milestoneId=10
    @GetMapping("/payments")
    public List<PaymentResponse> list(
            @RequestParam(required = false) Long contractId,
            @RequestParam(required = false) Long milestoneId
    ) {
        return service.list(contractId, milestoneId);
    }

    @DeleteMapping("/payments/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}