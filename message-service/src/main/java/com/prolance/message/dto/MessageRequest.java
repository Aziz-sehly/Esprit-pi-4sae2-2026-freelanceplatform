package com.prolance.message.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class MessageRequest {

    @NotNull
    private Long contractId;

    @NotNull
    private Long senderUserId;

    @NotNull
    private Long receiverUserId;

    @NotBlank
    private String content;

    private String attachmentUrl;
    private String attachmentFileName;
    private Long parentId;      // Reply to message
    private Long threadId;      // Thread root
    private Integer ephemeralMinutes;
    private Long ephemeralSeconds;  // Total seconds (days*86400 + hours*3600 + min*60 + sec)
    private java.time.LocalDateTime scheduledAt;
    private String contentType; // text, voice, image, etc.

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
    public Long getParentId() { return parentId; }
    public void setParentId(Long parentId) { this.parentId = parentId; }
    public Long getThreadId() { return threadId; }
    public void setThreadId(Long threadId) { this.threadId = threadId; }
    public Integer getEphemeralMinutes() { return ephemeralMinutes; }
    public void setEphemeralMinutes(Integer ephemeralMinutes) { this.ephemeralMinutes = ephemeralMinutes; }
    public Long getEphemeralSeconds() { return ephemeralSeconds; }
    public void setEphemeralSeconds(Long ephemeralSeconds) { this.ephemeralSeconds = ephemeralSeconds; }
    public java.time.LocalDateTime getScheduledAt() { return scheduledAt; }
    public void setScheduledAt(java.time.LocalDateTime scheduledAt) { this.scheduledAt = scheduledAt; }
    public String getContentType() { return contentType; }
    public void setContentType(String contentType) { this.contentType = contentType; }
}
