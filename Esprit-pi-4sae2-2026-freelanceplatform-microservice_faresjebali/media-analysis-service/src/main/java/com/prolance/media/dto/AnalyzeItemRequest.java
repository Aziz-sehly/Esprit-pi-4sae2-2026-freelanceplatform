package com.prolance.media.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class AnalyzeItemRequest {

    @NotNull
    private Long evidenceId;

    /** Chemin relatif, ex. {@code /messages/attachments/uuid.jpg} */
    @NotBlank
    private String resourcePath;

    public Long getEvidenceId() {
        return evidenceId;
    }

    public void setEvidenceId(Long evidenceId) {
        this.evidenceId = evidenceId;
    }

    public String getResourcePath() {
        return resourcePath;
    }

    public void setResourcePath(String resourcePath) {
        this.resourcePath = resourcePath;
    }
}
