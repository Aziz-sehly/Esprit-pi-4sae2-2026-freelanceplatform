package org.example.reviewsservice.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Stores a snapshot of a Review's content BEFORE it was edited.
 * Every time updateReview() is called, a new row is saved here first,
 * so the full edit history can be retrieved via GET /api/reviews/{id}/history.
 */
@Entity
@Table(name = "review_edit_history")
public class ReviewEditHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // The review this history entry belongs to
    @Column(nullable = false)
    private Long reviewId;

    // Content BEFORE the edit
    @Column(columnDefinition = "TEXT")
    private String oldContent;

    // Content AFTER the edit
    @Column(columnDefinition = "TEXT")
    private String newContent;

    // Rating BEFORE the edit
    private int oldRating;

    // Rating AFTER the edit
    private int newRating;

    // Who made the edit (copied from Review.author)
    private String editedBy;

    // When the edit was made
    private LocalDateTime editedAt;

    @PrePersist
    protected void onCreate() {
        editedAt = LocalDateTime.now();
    }

    // ── Getters ───────────────────────────────────────────────────────
    public Long getId()                { return id; }
    public Long getReviewId()          { return reviewId; }
    public String getOldContent()      { return oldContent; }
    public String getNewContent()      { return newContent; }
    public int getOldRating()          { return oldRating; }
    public int getNewRating()          { return newRating; }
    public String getEditedBy()        { return editedBy; }
    public LocalDateTime getEditedAt() { return editedAt; }

    // ── Setters ───────────────────────────────────────────────────────
    public void setId(Long id)                       { this.id = id; }
    public void setReviewId(Long reviewId)           { this.reviewId = reviewId; }
    public void setOldContent(String oldContent)     { this.oldContent = oldContent; }
    public void setNewContent(String newContent)     { this.newContent = newContent; }
    public void setOldRating(int oldRating)          { this.oldRating = oldRating; }
    public void setNewRating(int newRating)          { this.newRating = newRating; }
    public void setEditedBy(String editedBy)         { this.editedBy = editedBy; }
    public void setEditedAt(LocalDateTime editedAt)  { this.editedAt = editedAt; }
}