package com.milestone.milestone.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record MilestoneExtendRequest(
        LocalDate newDueDate,
        BigDecimal newAmount   // nullable — only set when extension carries an amount
) {}