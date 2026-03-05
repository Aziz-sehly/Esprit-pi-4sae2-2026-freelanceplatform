package org.example.forumservice.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

// @Entity marks this as a database table
@Entity

// The MySQL table will be named "replies"
@Table(name = "replies")
public class Reply {

    // Primary key — auto-incremented
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // The name of the user who wrote the reply
    private String author;

    // The reply text — stored as TEXT to support longer content
    @Column(columnDefinition = "TEXT")
    private String content;

    // The date and time this reply was created — set automatically by @PrePersist
    private LocalDateTime createdAt;

    // Many replies can belong to ONE post — this is the "many" side of a one-to-many relationship
    // @ManyToOne creates a foreign key column "post_id" in the replies table
    // This links each reply back to the post it belongs to
    @ManyToOne
    @JoinColumn(name = "post_id") // the actual column name in the replies table in MySQL
    // @JsonIgnore prevents infinite loops when converting to JSON:
    // Without it: Reply → Post → Replies → Reply → Post → ... (endless loop)
    // With it: when serializing a Reply to JSON, the "post" field is simply skipped
    @JsonIgnore
    private ForumPost post;

    // Automatically sets createdAt to the current time when a new reply is saved
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // ── Getters ───────────────────────────────────────────────────────
    public Long getId() { return id; }
    public String getAuthor() { return author; }
    public String getContent() { return content; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public ForumPost getPost() { return post; }

    // ── Setters ───────────────────────────────────────────────────────
    public void setId(Long id) { this.id = id; }
    public void setAuthor(String author) { this.author = author; }
    public void setContent(String content) { this.content = content; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    // This setter is used by ForumService when linking a reply to its parent post
    public void setPost(ForumPost post) { this.post = post; }
}