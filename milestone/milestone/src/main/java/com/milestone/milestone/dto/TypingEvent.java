package com.milestone.milestone.dto;

import com.milestone.milestone.models.MessageSenderRole;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public record TypingEvent(
        @NotNull Long contractId,
        @NotNull Long senderId,
        @NotNull MessageSenderRole senderRole,
        @NotBlank String senderName,
        boolean typing,
        LocalDateTime createdAt
) {
    public TypingEvent {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
