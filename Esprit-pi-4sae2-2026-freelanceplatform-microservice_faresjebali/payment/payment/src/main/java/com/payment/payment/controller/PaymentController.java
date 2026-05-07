package com.payment.payment.controller;

import com.payment.payment.dto.CheckoutSessionResponse;
import com.payment.payment.dto.PaymentRequest;
import com.payment.payment.dto.PaymentResponse;
import com.payment.payment.dto.RefundRequest;
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
    public PaymentResponse create(@RequestHeader("Authorization") String authorization, @RequestBody @Valid PaymentRequest req) {
        return service.create(req, authorization);
    }

    @PostMapping("/payments/checkout-session")
    @ResponseStatus(HttpStatus.CREATED)
    public CheckoutSessionResponse createCheckoutSession(@RequestHeader("Authorization") String authorization, @RequestBody @Valid PaymentRequest req) {
        return service.createCheckoutSession(req, authorization);
    }

    @GetMapping("/payments/{id}")
    public PaymentResponse getById(@RequestHeader("Authorization") String authorization, @PathVariable Long id) {
        return service.getById(id, authorization);
    }

    @PostMapping("/payments/webhook")
    @ResponseStatus(HttpStatus.OK)
    public void handleWebhook(@RequestBody String payload,
                              @RequestHeader(value = "Stripe-Signature", required = false) String signature) {
        service.handleStripeWebhook(payload, signature);
    }

    @PostMapping("/payments/{id}/release")
    public PaymentResponse release(@RequestHeader("Authorization") String authorization, @PathVariable Long id) {
        return service.release(id, authorization);
    }

    @PostMapping("/payments/{id}/refund")
    public PaymentResponse requestRefund(@RequestHeader("Authorization") String authorization, @PathVariable Long id, @RequestBody @Valid RefundRequest req) {
        return service.requestRefund(id, req, authorization);
    }

    @GetMapping("/payments")
    public List<PaymentResponse> list(
            @RequestHeader("Authorization") String authorization,
            @RequestParam(required = false) Long contractId,
            @RequestParam(required = false) Long milestoneId
    ) {
        return service.list(contractId, milestoneId, authorization);
    }

    @DeleteMapping("/payments/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@RequestHeader("Authorization") String authorization, @PathVariable Long id) {
        service.delete(id, authorization);
    }
}
