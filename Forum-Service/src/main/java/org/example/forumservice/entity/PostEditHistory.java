package org.example.forumservice.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Stores a snapshot of a ForumPost's content BEFORE it was edited.
 * Every time updatePost() is called, a new row is saved here first,
 * so the full edit history can be retrieved via GET /api/posts/{id}/history.
 */
@Entity
@Table(name = "post_edit_history")
public class PostEditHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // The post this history entry belongs to
    @Column(nullable = false)
    private Long postId;

    // Snapshot of the title BEFORE the edit
    private String oldTitle;

    // Snapshot of the content BEFORE the edit
    @Column(columnDefinition = "TEXT")
    private String oldContent;

    // New title AFTER the edit
    private String newTitle;

    // New content AFTER the edit
    @Column(columnDefinition = "TEXT")
    private String newContent;

    // Who made the edit (copied from ForumPost.author)
    private String editedBy;

    // When the edit was made
    private LocalDateTime editedAt;

    @PrePersist
    protected void onCreate() {
        editedAt = LocalDateTime.now();
    }

    // ── Getters ───────────────────────────────────────────────────────
    public Long getId()                  { return id; }
    public Long getPostId()              { return postId; }
    public String getOldTitle()          { return oldTitle; }
    public String getOldContent()        { return oldContent; }
    public String getNewTitle()          { return newTitle; }
    public String getNewContent()        { return newContent; }
    public String getEditedBy()          { return editedBy; }
    public LocalDateTime getEditedAt()   { return editedAt; }

    // ── Setters ───────────────────────────────────────────────────────
    public void setId(Long id)                         { this.id = id; }
    public void setPostId(Long postId)                 { this.postId = postId; }
    public void setOldTitle(String oldTitle)           { this.oldTitle = oldTitle; }
    public void setOldContent(String oldContent)       { this.oldContent = oldContent; }
    public void setNewTitle(String newTitle)           { this.newTitle = newTitle; }
    public void setNewContent(String newContent)       { this.newContent = newContent; }
    public void setEditedBy(String editedBy)           { this.editedBy = editedBy; }
    public void setEditedAt(LocalDateTime editedAt)    { this.editedAt = editedAt; }
}