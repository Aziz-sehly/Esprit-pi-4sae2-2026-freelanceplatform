package com.milestone.milestone.dto;

import com.milestone.milestone.models.DisputeReason;
import com.milestone.milestone.models.DisputeStatus;
import com.milestone.milestone.models.MessageSenderRole;

import java.time.LocalDateTime;

public record DisputeResponse(
        Long id,
        Long contractId,
        Long milestoneId,
        Long paymentId,
        DisputeReason reason,
        DisputeStatus status,
        MessageSenderRole openedByRole,
        Long openedById,
        String openedByName,
        String title,
        String description,
        String resolutionNote,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        LocalDateTime resolvedAt
) {
}
