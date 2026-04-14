package com.milestone.milestone.models;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContractMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long contractId;

    @Column(nullable = false)
    private Long senderId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private MessageSenderRole senderRole;

    @Column(nullable = false, length = 120)
    private String senderName;

    @Column(length = 4000)
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(length = 24)
    private ChatAttachmentType attachmentType;

    @Column(length = 160)
    private String attachmentLabel;

    @Column(length = 2048)
    private String attachmentUrl;

    @Column(length = 260)
    private String attachmentFileName;

    @Column(length = 160)
    private String attachmentMimeType;

    private Long attachmentFileSize;

    @Column(length = 512)
    private String attachmentStoragePath;

    @Column(nullable = false)
    private LocalDateTime sentAt;

    @PrePersist
    void onCreate() {
        sentAt = LocalDateTime.now();
    }
}
