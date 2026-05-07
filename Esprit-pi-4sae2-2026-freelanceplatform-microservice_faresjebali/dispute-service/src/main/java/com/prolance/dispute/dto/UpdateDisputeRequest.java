package com.prolance.dispute.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDateTime;

public class UpdateDisputeRequest {

    @NotBlank
    private String disputeType;

    @NotBlank
    private String reason;

    /**
     * Optional SLA deadline (admin updates only; ignored for non-admin {@code PUT /{id}}).
     */
    private LocalDateTime deadlineAt;

    /**
     * When {@code true}, clears {@code deadlineAt} (admin updates only).
     */
    private Boolean removeDeadline;

    public String getDisputeType() {
        return disputeType;
    }

    public void setDisputeType(String disputeType) {
        this.disputeType = disputeType;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public LocalDateTime getDeadlineAt() {
        return deadlineAt;
    }

    public void setDeadlineAt(LocalDateTime deadlineAt) {
        this.deadlineAt = deadlineAt;
    }

    public Boolean getRemoveDeadline() {
        return removeDeadline;
    }

    public void setRemoveDeadline(Boolean removeDeadline) {
        this.removeDeadline = removeDeadline;
    }
}
