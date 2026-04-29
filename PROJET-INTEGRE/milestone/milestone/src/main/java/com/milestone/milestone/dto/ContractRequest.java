package com.milestone.milestone.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ContractRequest(
        @NotNull Long clientId,
        @NotNull Long freelancerId,
        @NotBlank String title,
        @NotBlank String scope,
        @NotNull @DecimalMin(value = "0.0", inclusive = false) BigDecimal totalBudget,
        @NotBlank String clientName,
        @NotBlank String freelancerName,
        LocalDate startDate,
        LocalDate endDate
) {
}
