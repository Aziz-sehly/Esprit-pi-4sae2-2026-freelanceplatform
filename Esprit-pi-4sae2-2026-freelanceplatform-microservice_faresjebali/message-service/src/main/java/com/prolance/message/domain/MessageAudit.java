package com.prolance.message.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "message_audit")
public class MessageAudit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long messageId;

    @Column(nullable = false, length = 50)
    private String action; // CREATED, READ, UPDATED, DELETED

    @Column(nullable = false)
    private Long userId;

    @Column(length = 500)
    private String details;

    @Column(nullable = false)
    private LocalDateTime performedAt;

    public MessageAudit() {
        this.performedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public Long getMessageId() { return messageId; }
    public void setMessageId(Long messageId) { this.messageId = messageId; }
    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }
    public LocalDateTime getPerformedAt() { return performedAt; }
}
