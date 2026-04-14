package com.milestone.milestone.dto;

import com.milestone.milestone.models.DisputeReason;
import com.milestone.milestone.models.MessageSenderRole;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record DisputeCreateRequest(
        @NotNull Long contractId,
        Long milestoneId,
        Long paymentId,
        @NotNull DisputeReason reason,
        @NotNull MessageSenderRole openedByRole,
        @NotNull Long openedById,
        @NotBlank String openedByName,
        @NotBlank @Size(max = 160) String title,
        @NotBlank @Size(max = 3000) String description
) {
}
