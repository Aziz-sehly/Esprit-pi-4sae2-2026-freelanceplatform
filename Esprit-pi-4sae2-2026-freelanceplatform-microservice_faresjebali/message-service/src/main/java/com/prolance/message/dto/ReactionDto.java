package com.prolance.message.dto;

import java.time.LocalDateTime;

public record ReactionDto(Long id, Long messageId, Long userId, String emoji, LocalDateTime createdAt) {}
