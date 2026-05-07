package com.milestone.milestone.dto;

import org.antlr.v4.runtime.misc.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record MilestoneRequest(
        Long contractId,
        String title,
        String deliverable,
        BigDecimal amount,
        LocalDate dueDate
) {
}