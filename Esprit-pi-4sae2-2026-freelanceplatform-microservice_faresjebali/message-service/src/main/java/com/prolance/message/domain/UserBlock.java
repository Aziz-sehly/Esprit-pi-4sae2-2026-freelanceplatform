package com.prolance.message.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_blocks")
public class UserBlock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long blockerUserId;

    @Column(nullable = false)
    private Long blockedUserId;

    @Column(nullable = false)
    private LocalDateTime blockedAt;

    public UserBlock() {
        this.blockedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public Long getBlockerUserId() { return blockerUserId; }
    public void setBlockerUserId(Long blockerUserId) { this.blockerUserId = blockerUserId; }
    public Long getBlockedUserId() { return blockedUserId; }
    public void setBlockedUserId(Long blockedUserId) { this.blockedUserId = blockedUserId; }
    public LocalDateTime getBlockedAt() { return blockedAt; }
}
