package com.prolance.dispute.dto;

import com.prolance.dispute.domain.DisputeStatus;
import com.prolance.dispute.domain.ResolutionType;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public class ResolveDisputeRequest {

    @NotNull
    private Long resolvedByUserId;

    @NotNull
    private DisputeStatus status;

    private ResolutionType resolutionType;

    private String resolutionNote;

    private BigDecimal refundAmount;

    public Long getResolvedByUserId() {
        return resolvedByUserId;
    }

    public void setResolvedByUserId(Long resolvedByUserId) {
        this.resolvedByUserId = resolvedByUserId;
    }

    public DisputeStatus getStatus() {
        return status;
    }

    public void setStatus(DisputeStatus status) {
        this.status = status;
    }

    public ResolutionType getResolutionType() {
        return resolutionType;
    }

    public void setResolutionType(ResolutionType resolutionType) {
        this.resolutionType = resolutionType;
    }

    public String getResolutionNote() {
        return resolutionNote;
    }

    public void setResolutionNote(String resolutionNote) {
        this.resolutionNote = resolutionNote;
    }

    public BigDecimal getRefundAmount() {
        return refundAmount;
    }

    public void setRefundAmount(BigDecimal refundAmount) {
        this.refundAmount = refundAmount;
    }
}
