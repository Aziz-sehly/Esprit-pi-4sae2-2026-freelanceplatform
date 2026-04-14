package com.milestone.milestone.dto;

import com.milestone.milestone.models.ResourceCategory;
import com.milestone.milestone.models.ResourceEntityType;
import com.milestone.milestone.models.ResourceType;

import java.time.LocalDateTime;

public record ResourceResponse(
        Long id,
        ResourceEntityType entityType,
        Long entityId,
        ResourceType resourceType,
        ResourceCategory category,
        String label,
        String url,
        String fileName,
        String mimeType,
        Long fileSize,
        LocalDateTime createdAt,
        String downloadUrl
) {
}
