package com.prolance.dispute.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class CreateDisputeRequest {

    @NotNull
    private Long contractId;

    /** Ignored on create: set from {@code X-User-Id} (gateway JWT). Optional in JSON for backward compatibility. */
    private Long raisedByUserId;

    /** Optional: contact / counterparty user id (stored on dispute). */
    private Long contactUserId;

    @NotBlank
    private String disputeType;

    @NotBlank
    private String reason;

    public Long getContractId() {
        return contractId;
    }

    public void setContractId(Long contractId) {
        this.contractId = contractId;
    }

    public Long getRaisedByUserId() {
        return raisedByUserId;
    }

    public void setRaisedByUserId(Long raisedByUserId) {
        this.raisedByUserId = raisedByUserId;
    }

    public Long getContactUserId() {
        return contactUserId;
    }

    public void setContactUserId(Long contactUserId) {
        this.contactUserId = contactUserId;
    }

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
