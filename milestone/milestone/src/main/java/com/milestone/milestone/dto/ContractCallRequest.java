package com.milestone.milestone.dto;

import com.milestone.milestone.models.MessageSenderRole;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ContractCallRequest(
        @NotNull Long senderId,
        @NotNull MessageSenderRole senderRole,
        @NotBlank String senderName
) {
}
