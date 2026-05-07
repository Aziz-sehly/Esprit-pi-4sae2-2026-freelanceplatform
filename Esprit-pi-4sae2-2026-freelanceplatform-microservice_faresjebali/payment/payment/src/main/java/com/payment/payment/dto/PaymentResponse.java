package com.payment.payment.dto;

import com.payment.payment.model.PaymentMethod;
import com.payment.payment.model.PaymentStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PaymentResponse(
        Long id,
        Long contractId,
        Long milestoneId,
        Long payerId,
        Long payeeId,
        BigDecimal amount,
        BigDecimal platformFee,
        BigDecimal netAmount,
        PaymentMethod method,
        PaymentStatus status,
        String provider,
        String providerRef,
        String stripeCheckoutSessionId,
        String currency,
        LocalDateTime releasedAt,
        LocalDateTime refundedAt,
        LocalDateTime createdAt
) {}
