package com.prolance.dispute.dto;

import java.time.LocalDateTime;

public class AuditEventDto {

    private String eventType;
    private Long actorUserId;
    private String details;
    private LocalDateTime createdAt;

    public AuditEventDto() {
    }

    public AuditEventDto(String eventType, Long actorUserId, String details, LocalDateTime createdAt) {
        this.eventType = eventType;
        this.actorUserId = actorUserId;
        this.details = details;
        this.createdAt = createdAt;
    }

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public Long getActorUserId() {
        return actorUserId;
    }

    public void setActorUserId(Long actorUserId) {
        this.actorUserId = actorUserId;
    }

    public String getDetails() {
        return details;
    }

    public void setDetails(String details) {
        this.details = details;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}

