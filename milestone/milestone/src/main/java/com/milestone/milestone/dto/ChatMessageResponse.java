package com.milestone.milestone.dto;

import com.milestone.milestone.models.MessageSenderRole;
import com.milestone.milestone.models.ChatAttachmentType;

import java.time.LocalDateTime;

public record ChatMessageResponse(
        Long id,
        Long contractId,
        Long senderId,
        MessageSenderRole senderRole,
        String senderName,
        String content,
        LocalDateTime sentAt,
        ChatAttachmentType attachmentType,
        String attachmentLabel,
        String attachmentUrl,
        String attachmentFileName,
        String attachmentMimeType,
        Long attachmentFileSize,
        String attachmentDownloadUrl
) {
}
