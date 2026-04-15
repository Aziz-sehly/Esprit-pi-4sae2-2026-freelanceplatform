package org.example.forumservice.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "messages")
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long senderId;
    private String senderName;

    private Long recipientId;
    private String recipientName;

    @Column(columnDefinition = "TEXT")
    private String content;

    private LocalDateTime sentAt;

    @Column(nullable = false)
    private boolean read = false;

    @PrePersist
    protected void onCreate() {
        sentAt = LocalDateTime.now();
    }

    // Getters
    public Long getId()               { return id; }
    public Long getSenderId()         { return senderId; }
    public String getSenderName()     { return senderName; }
    public Long getRecipientId()      { return recipientId; }
    public String getRecipientName()  { return recipientName; }
    public String getContent()        { return content; }
    public LocalDateTime getSentAt()  { return sentAt; }
    public boolean isRead()           { return read; }

    // Setters
    public void setId(Long id)                        { this.id = id; }
    public void setSenderId(Long senderId)             { this.senderId = senderId; }
    public void setSenderName(String senderName)       { this.senderName = senderName; }
    public void setRecipientId(Long recipientId)       { this.recipientId = recipientId; }
    public void setRecipientName(String recipientName) { this.recipientName = recipientName; }
    public void setContent(String content)             { this.content = content; }
    public void setSentAt(LocalDateTime sentAt)        { this.sentAt = sentAt; }
    public void setRead(boolean read)                  { this.read = read; }
}