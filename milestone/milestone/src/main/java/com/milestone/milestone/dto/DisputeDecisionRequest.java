package com.milestone.milestone.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record DisputeDecisionRequest(
        @NotBlank @Size(max = 2400) String note
) {
}
