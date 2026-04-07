package com.prolance.dispute.dto;

import jakarta.validation.constraints.NotBlank;

public class UpdateDisputeRequest {

    @NotBlank
    private String disputeType;

    @NotBlank
    private String reason;

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
}
