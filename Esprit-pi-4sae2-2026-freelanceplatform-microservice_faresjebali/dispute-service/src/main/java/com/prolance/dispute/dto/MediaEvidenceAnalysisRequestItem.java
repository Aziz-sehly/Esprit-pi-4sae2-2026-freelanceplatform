package com.prolance.dispute.dto;

/**
 * Requête batch vers media-analysis-service (même schéma JSON que {@code AnalyzeItemRequest} côté analyse).
 */
public class MediaEvidenceAnalysisRequestItem {

    private Long evidenceId;
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
