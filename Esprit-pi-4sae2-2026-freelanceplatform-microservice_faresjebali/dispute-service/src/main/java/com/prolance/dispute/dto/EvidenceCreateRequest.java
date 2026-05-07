package com.prolance.dispute.dto;

import jakarta.validation.constraints.NotBlank;

public class EvidenceCreateRequest {

    @NotBlank
    private String fileUrl;

    @NotBlank
    private String fileName;

    // User-provided tag/category (e.g. PAYMENT, DELIVERY, OTHER).
    private String category;

    public String getFileUrl() {
        return fileUrl;
    }

    public void setFileUrl(String fileUrl) {
        this.fileUrl = fileUrl;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }
}

