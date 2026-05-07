package com.payment.payment.dto;

import java.time.LocalDateTime;

public record NotificationMessage(
        String type,
        Long contractId,
        Long milestoneId,
        Long paymentId,
        String message,
        LocalDateTime createdAt
) {
}
