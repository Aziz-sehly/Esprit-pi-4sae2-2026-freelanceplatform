package com.payment.payment.dto;

import com.payment.payment.model.PaymentMethod;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public record PaymentRequest(
        @NotNull Long contractId,
        Long milestoneId,
        @NotNull Long payerId,
        @NotNull Long payeeId,
        @NotNull @DecimalMin(value = "0.0", inclusive = false) BigDecimal amount,
        @NotNull PaymentMethod method
) {}