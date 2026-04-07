package com.prolance.dispute.dto;

import java.time.LocalDateTime;

public class EvidenceDto {

    private Long id;
    private Long disputeId;
    private Long uploaderUserId;
    private String fileUrl;
    private String fileName;
    private String category;
    private String adminNote;
    private LocalDateTime createdAt;

    public EvidenceDto() {
    }

    public EvidenceDto(Long id, Long disputeId, Long uploaderUserId, String fileUrl, String fileName, String category, String adminNote, LocalDateTime createdAt) {
        this.id = id;
        this.disputeId = disputeId;
        this.uploaderUserId = uploaderUserId;
        this.fileUrl = fileUrl;
        this.fileName = fileName;
        this.category = category;
        this.adminNote = adminNote;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getDisputeId() {
        return disputeId;
    }

    public void setDisputeId(Long disputeId) {
        this.disputeId = disputeId;
    }

    public Long getUploaderUserId() {
        return uploaderUserId;
    }

    public void setUploaderUserId(Long uploaderUserId) {
        this.uploaderUserId = uploaderUserId;
    }

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

    public String getAdminNote() {
        return adminNote;
    }

    public void setAdminNote(String adminNote) {
        this.adminNote = adminNote;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}

