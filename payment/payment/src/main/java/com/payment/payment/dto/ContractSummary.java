package com.payment.payment.dto;

import java.math.BigDecimal;

public record ContractSummary(
        Long id,
        Long clientId,
        Long freelancerId,
        String title,
        String scope,
        BigDecimal totalBudget,
        String clientName,
        String freelancerName,
        String startDate,
        String endDate,
        String respondedAt,
        String status,
        String createdAt,
        String updatedAt
) {}
