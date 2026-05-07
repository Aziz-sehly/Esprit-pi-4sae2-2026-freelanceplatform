package com.milestone.milestone.dto;

import com.milestone.milestone.models.ResourceCategory;
import com.milestone.milestone.models.ResourceEntityType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ResourceLinkRequest(
        @NotNull ResourceEntityType entityType,
        @NotNull Long entityId,
        @NotNull ResourceCategory category,
        @NotBlank String label,
        @NotBlank String url
) {
}
