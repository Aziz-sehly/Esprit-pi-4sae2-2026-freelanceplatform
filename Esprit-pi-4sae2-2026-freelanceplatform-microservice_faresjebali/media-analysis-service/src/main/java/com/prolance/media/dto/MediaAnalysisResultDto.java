package com.prolance.media.dto;

/**
 * Résultat d’analyse pour une preuve (utilisé par dispute-service / insights).
 */
public class MediaAnalysisResultDto {

    private Long evidenceId;
    /** IMAGE, VIDEO, PDF, TEXT, UNKNOWN */
    private String mediaType;
    private Integer width;
    private Integer height;
    private Long fileSizeBytes;
    private Integer pdfPageCount;
    private Integer textSampleChars;
    /** 0–1 : qualité intrinsèque (résolution, pages, taille utile du texte, etc.) */
    private Double intrinsicQualityScore;
    private String error;

    public Long getEvidenceId() {
        return evidenceId;
    }

    public void setEvidenceId(Long evidenceId) {
        this.evidenceId = evidenceId;
    }

    public String getMediaType() {
        return mediaType;
    }

    public void setMediaType(String mediaType) {
        this.mediaType = mediaType;
    }

    public Integer getWidth() {
        return width;
    }

    public void setWidth(Integer width) {
        this.width = width;
    }

    public Integer getHeight() {
        return height;
    }

    public void setHeight(Integer height) {
        this.height = height;
    }

    public Long getFileSizeBytes() {
        return fileSizeBytes;
    }

    public void setFileSizeBytes(Long fileSizeBytes) {
        this.fileSizeBytes = fileSizeBytes;
    }

    public Integer getPdfPageCount() {
        return pdfPageCount;
    }

    public void setPdfPageCount(Integer pdfPageCount) {
        this.pdfPageCount = pdfPageCount;
    }

    public Integer getTextSampleChars() {
        return textSampleChars;
    }

    public void setTextSampleChars(Integer textSampleChars) {
        this.textSampleChars = textSampleChars;
    }

    public Double getIntrinsicQualityScore() {
        return intrinsicQualityScore;
    }

    public void setIntrinsicQualityScore(Double intrinsicQualityScore) {
        this.intrinsicQualityScore = intrinsicQualityScore;
    }

    public String getError() {
        return error;
    }

    public void setError(String error) {
        this.error = error;
    }
}
