package com.milestone.milestone.dto;

import jakarta.validation.constraints.NotBlank;

public record MilestoneFeedbackRequest(
        @NotBlank String feedback,
        Long actorId
) {
}
