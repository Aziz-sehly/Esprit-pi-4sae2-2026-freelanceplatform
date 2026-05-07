package com.prolance.dispute.dto;

import com.prolance.dispute.domain.Dispute;

import java.util.List;

public class DisputeDetailsResponse {

    private Dispute dispute;
    private List<MessageDto> relatedMessages;

    public DisputeDetailsResponse(Dispute dispute, List<MessageDto> relatedMessages) {
        this.dispute = dispute;
        this.relatedMessages = relatedMessages;
    }

    public Dispute getDispute() {
        return dispute;
    }

    public void setDispute(Dispute dispute) {
        this.dispute = dispute;
    }

    public List<MessageDto> getRelatedMessages() {
        return relatedMessages;
    }

    public void setRelatedMessages(List<MessageDto> relatedMessages) {
        this.relatedMessages = relatedMessages;
    }
}
