package com.prolance.dispute.dto;

import com.fasterxml.jackson.annotation.JsonUnwrapped;
import com.prolance.dispute.domain.Dispute;

/**
 * Admin list row: full dispute JSON flattened plus {@code escalationScore} for triage sorting.
 */
public class AdminDisputeRowDto {

    @JsonUnwrapped
    private Dispute dispute;
    private Double escalationScore;

    public AdminDisputeRowDto() {
    }

    public AdminDisputeRowDto(Dispute dispute, double escalationScore) {
        this.dispute = dispute;
        this.escalationScore = escalationScore;
    }

    public Dispute getDispute() {
        return dispute;
    }

    public void setDispute(Dispute dispute) {
        this.dispute = dispute;
    }

    public Double getEscalationScore() {
        return escalationScore;
    }

    public void setEscalationScore(Double escalationScore) {
        this.escalationScore = escalationScore;
    }
}
