package com.prolance.dispute.dto;

import jakarta.validation.constraints.NotNull;

public class EvidenceMetadataUpdateRequest {

    // Admin-set category/tag for organization/filtering
    private String category;

    // Admin-only note shown in evidence list to admins
    private String adminNote;

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
}

