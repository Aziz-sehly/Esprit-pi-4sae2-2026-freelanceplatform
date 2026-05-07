package com.milestone.milestone.dto;

import com.milestone.milestone.models.ContractStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record ContractResponse(
        Long id,
        Long clientId,
        Long freelancerId,
        String title,
        String scope,
        BigDecimal totalBudget,
        String clientName,
        String freelancerName,
        LocalDate startDate,
        LocalDate endDate,
        LocalDateTime respondedAt,
        ContractStatus status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
