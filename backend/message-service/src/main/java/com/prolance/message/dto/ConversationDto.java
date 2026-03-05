package com.prolance.message.dto;

import com.prolance.message.domain.Message;

public class ConversationDto {

    private Long contractId;
    private Long otherUserId;
    private Message lastMessage;
    private long unreadCount;

    public ConversationDto(Long contractId, Long otherUserId, Message lastMessage, long unreadCount) {
        this.contractId = contractId;
        this.otherUserId = otherUserId;
        this.lastMessage = lastMessage;
        this.unreadCount = unreadCount;
    }

    public Long getContractId() {
        return contractId;
    }

    public void setContractId(Long contractId) {
        this.contractId = contractId;
    }

    public Long getOtherUserId() {
        return otherUserId;
    }

    public void setOtherUserId(Long otherUserId) {
        this.otherUserId = otherUserId;
    }

    public Message getLastMessage() {
        return lastMessage;
    }

    public void setLastMessage(Message lastMessage) {
        this.lastMessage = lastMessage;
    }

    public long getUnreadCount() {
        return unreadCount;
    }

    public void setUnreadCount(long unreadCount) {
        this.unreadCount = unreadCount;
    }
}
