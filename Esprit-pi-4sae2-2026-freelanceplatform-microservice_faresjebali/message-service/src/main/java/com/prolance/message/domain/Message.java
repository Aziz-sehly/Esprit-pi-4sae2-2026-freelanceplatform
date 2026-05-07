package com.prolance.message.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "messages")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long contractId;

    @Column(nullable = false)
    private Long senderUserId;

    @Column(nullable = false)
    private Long receiverUserId;

    @Column(nullable = false, length = 2000)
    private String content;

    @Column(length = 500)
    private String attachmentUrl;

    @Column(length = 255)
    private String attachmentFileName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MessageStatus status;

    @Column(nullable = false)
    private LocalDateTime sentAt;

    private Long parentId; // Reply to message
    private Long threadId; // Thread root
    private Integer ephemeralMinutes; // Auto-delete after X min (null = permanent) - deprecated, use ephemeralSeconds
    private Long ephemeralSeconds; // Auto-delete after X seconds (null = use ephemeralMinutes or permanent)
    private LocalDateTime scheduledAt; // When to send (null = immediate)
    private Boolean isArchived;
    @Column(length = 50)
    private String contentType; // text, voice, image, etc.

    public Long getId() {
        return id;
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

    public Long getParentId() { return parentId; }
    public void setParentId(Long parentId) { this.parentId = parentId; }
    public Long getThreadId() { return threadId; }
    public void setThreadId(Long threadId) { this.threadId = threadId; }
    public Integer getEphemeralMinutes() { return ephemeralMinutes; }
    public void setEphemeralMinutes(Integer ephemeralMinutes) { this.ephemeralMinutes = ephemeralMinutes; }
    public Long getEphemeralSeconds() { return ephemeralSeconds; }
    public void setEphemeralSeconds(Long ephemeralSeconds) { this.ephemeralSeconds = ephemeralSeconds; }
    public LocalDateTime getScheduledAt() { return scheduledAt; }
    public void setScheduledAt(LocalDateTime scheduledAt) { this.scheduledAt = scheduledAt; }
    public Boolean getIsArchived() { return isArchived != null && isArchived; }
    public void setIsArchived(Boolean isArchived) { this.isArchived = isArchived; }
    public String getContentType() { return contentType; }
    public void setContentType(String contentType) { this.contentType = contentType; }
}
