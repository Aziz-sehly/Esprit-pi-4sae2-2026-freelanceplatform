package org.example.forumservice.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "replies")
public class Reply {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String author;

    @Column(columnDefinition = "TEXT")
    private String content;

    private LocalDateTime createdAt;

    // ── NEW: Like count ───────────────────────────────────────────────
    // Tracks how many times this reply has been liked.
    // Global (PC-level) — not tied to any user.
    // Starts at 0, incremented by POST /api/posts/replies/{id}/like
    // Hibernate will add a "like_count" INT column automatically via ddl-auto=update
    @Column(nullable = false)
    private int likeCount = 0;

    // Many replies → one post. @JsonIgnore prevents infinite JSON recursion.
    @ManyToOne
    @JoinColumn(name = "post_id")
    @JsonIgnore
    private ForumPost post;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // ── Getters ───────────────────────────────────────────────────────
    public Long getId()                 { return id; }
    public String getAuthor()           { return author; }
    public String getContent()          { return content; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public int getLikeCount()           { return likeCount; }
    public ForumPost getPost()          { return post; }

    // ── Setters ───────────────────────────────────────────────────────
    public void setId(Long id)                        { this.id = id; }
    public void setAuthor(String author)              { this.author = author; }
    public void setContent(String content)            { this.content = content; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setLikeCount(int likeCount)           { this.likeCount = likeCount; }
    public void setPost(ForumPost post)               { this.post = post; }
}