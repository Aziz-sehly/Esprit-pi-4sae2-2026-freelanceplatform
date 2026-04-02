package com.prolance.message.dto;

public class ConversationDto {

    private Long contractId;
    private Long otherUserId;
    private ConversationLastMessageDto lastMessage;
    private long unreadCount;

    public ConversationDto(Long contractId, Long otherUserId, ConversationLastMessageDto lastMessage, long unreadCount) {
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

    public ConversationLastMessageDto getLastMessage() {
        return lastMessage;
    }

    public void setLastMessage(ConversationLastMessageDto lastMessage) {
        this.lastMessage = lastMessage;
    }

    public long getUnreadCount() {
        return unreadCount;
    }

    public void setUnreadCount(long unreadCount) {
        this.unreadCount = unreadCount;
    }
}
