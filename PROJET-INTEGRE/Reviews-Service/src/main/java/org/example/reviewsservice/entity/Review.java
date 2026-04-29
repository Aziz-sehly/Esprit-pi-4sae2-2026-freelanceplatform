package org.example.reviewsservice.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "reviews")
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String author;

    @Column(columnDefinition = "TEXT")
    private String content;

    private int rating;
    private double averageRating;
    private LocalDateTime createdAt;
    private String language;
    private String reviewReason;

    @Column(nullable = false)
    private boolean bookmarked = false;

    @Column(nullable = false)
    private int helpfulVotes = 0;

    private String sentiment;

    // NEW: Whether this review has ever been edited.
    // Set to true by updateReview() so the frontend can show an "edited" badge.
    // Hibernate adds an "edited" TINYINT(1) column via ddl-auto=update
    @Column(nullable = false)
    private boolean edited = false;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // ── Getters ───────────────────────────────────────────────────────
    public Long getId()                  { return id; }
    public String getAuthor()            { return author; }
    public String getContent()           { return content; }
    public int getRating()               { return rating; }
    public double getAverageRating()     { return averageRating; }
    public LocalDateTime getCreatedAt()  { return createdAt; }
    public String getLanguage()          { return language; }
    public String getReviewReason()      { return reviewReason; }
    public boolean isBookmarked()        { return bookmarked; }
    public int getHelpfulVotes()         { return helpfulVotes; }
    public String getSentiment()         { return sentiment; }
    public boolean isEdited()            { return edited; }

    // ── Setters ───────────────────────────────────────────────────────
    public void setId(Long id)                         { this.id = id; }
    public void setAuthor(String author)               { this.author = author; }
    public void setContent(String content)             { this.content = content; }
    public void setRating(int rating)                  { this.rating = rating; }
    public void setAverageRating(double averageRating) { this.averageRating = averageRating; }
    public void setCreatedAt(LocalDateTime createdAt)  { this.createdAt = createdAt; }
    public void setLanguage(String language)           { this.language = language; }
    public void setReviewReason(String reviewReason)   { this.reviewReason = reviewReason; }
    public void setBookmarked(boolean bookmarked)      { this.bookmarked = bookmarked; }
    public void setHelpfulVotes(int helpfulVotes)      { this.helpfulVotes = helpfulVotes; }
    public void setSentiment(String sentiment)         { this.sentiment = sentiment; }
    public void setEdited(boolean edited)              { this.edited = edited; }
}