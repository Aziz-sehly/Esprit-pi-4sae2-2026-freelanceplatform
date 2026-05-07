package com.prolance.message.dto;

import com.prolance.message.domain.Message;
import com.prolance.message.domain.MessageStatus;

import java.time.LocalDateTime;

/**
 * Plain JSON shape for the last message in a conversation (avoids serializing JPA {@link Message} in API responses).
 */
public class ConversationLastMessageDto {

    private Long id;
    private Long contractId;
    private Long senderUserId;
    private Long receiverUserId;
    private String content;
    private MessageStatus status;
    private LocalDateTime sentAt;
    private String attachmentUrl;
    private String attachmentFileName;
    private Long parentId;
    private Long threadId;
    private Integer ephemeralMinutes;
    private Long ephemeralSeconds;
    private LocalDateTime scheduledAt;
    private Boolean isArchived;
    private String contentType;

    public static ConversationLastMessageDto from(Message m) {
        if (m == null) {
            return null;
        }
        ConversationLastMessageDto d = new ConversationLastMessageDto();
        d.setId(m.getId());
        d.setContractId(m.getContractId());
        d.setSenderUserId(m.getSenderUserId());
        d.setReceiverUserId(m.getReceiverUserId());
        d.setContent(m.getContent());
        d.setStatus(m.getStatus());
        d.setSentAt(m.getSentAt());
        d.setAttachmentUrl(m.getAttachmentUrl());
        d.setAttachmentFileName(m.getAttachmentFileName());
        d.setParentId(m.getParentId());
        d.setThreadId(m.getThreadId());
        d.setEphemeralMinutes(m.getEphemeralMinutes());
        d.setEphemeralSeconds(m.getEphemeralSeconds());
        d.setScheduledAt(m.getScheduledAt());
        d.setIsArchived(m.getIsArchived());
        d.setContentType(m.getContentType());
        return d;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getContractId() {
        return contractId;
    }

    public void setContractId(Long contractId) {
        this.contractId = contractId;
    }

    public Long getSenderUserId() {
        return senderUserId;
    }

    public void setSenderUserId(Long senderUserId) {
        this.senderUserId = senderUserId;
    }

    public Long getReceiverUserId() {
        return receiverUserId;
    }

    public void setReceiverUserId(Long receiverUserId) {
        this.receiverUserId = receiverUserId;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public MessageStatus getStatus() {
        return status;
    }

    public void setStatus(MessageStatus status) {
        this.status = status;
    }

    public LocalDateTime getSentAt() {
        return sentAt;
    }

    public void setSentAt(LocalDateTime sentAt) {
        this.sentAt = sentAt;
    }

    public String getAttachmentUrl() {
        return attachmentUrl;
    }

    public void setAttachmentUrl(String attachmentUrl) {
        this.attachmentUrl = attachmentUrl;
    }

    public String getAttachmentFileName() {
        return attachmentFileName;
    }

    public void setAttachmentFileName(String attachmentFileName) {
        this.attachmentFileName = attachmentFileName;
    }

    public Long getParentId() {
        return parentId;
    }

    public void setParentId(Long parentId) {
        this.parentId = parentId;
    }

    public Long getThreadId() {
        return threadId;
    }

    public void setThreadId(Long threadId) {
        this.threadId = threadId;
    }

    public Integer getEphemeralMinutes() {
        return ephemeralMinutes;
    }

    public void setEphemeralMinutes(Integer ephemeralMinutes) {
        this.ephemeralMinutes = ephemeralMinutes;
    }

    public Long getEphemeralSeconds() {
        return ephemeralSeconds;
    }

    public void setEphemeralSeconds(Long ephemeralSeconds) {
        this.ephemeralSeconds = ephemeralSeconds;
    }

    public LocalDateTime getScheduledAt() {
        return scheduledAt;
    }

    public void setScheduledAt(LocalDateTime scheduledAt) {
        this.scheduledAt = scheduledAt;
    }

    public Boolean getIsArchived() {
        return isArchived;
    }

    public void setIsArchived(Boolean isArchived) {
        this.isArchived = isArchived;
    }

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }
}
