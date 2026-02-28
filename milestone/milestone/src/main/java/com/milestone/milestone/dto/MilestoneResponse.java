package com.milestone.milestone.dto;


import com.milestone.milestone.models.MilestoneStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record MilestoneResponse(
        Long id,
        Long contractId,
        String title,
        String deliverable,
        BigDecimal amount,
        LocalDate dueDate,
        MilestoneStatus status,
        LocalDateTime submittedAt,

        LocalDateTime clientApprovedAt,
        LocalDateTime paidAt,
        LocalDateTime createdAt
) {}