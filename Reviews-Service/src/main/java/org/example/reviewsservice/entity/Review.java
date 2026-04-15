package org.example.reviewsservice.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

<<<<<<< HEAD
// @Entity tells Spring/Hibernate: "this Java class represents a table in the database"
// Every time this app starts, Hibernate checks if the "reviews" table exists and creates/updates it
@Entity

// @Table(name = "reviews") specifies the exact name of the table in MySQL
@Table(name = "reviews")
public class Review {

    // @Id marks this field as the PRIMARY KEY of the table
    @Id
    // @GeneratedValue means MySQL will auto-increment this number (1, 2, 3...)
    // so we never have to set the ID manually
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // The name of the person who wrote the review — stored as a VARCHAR in MySQL
    private String author;

    // @Column(columnDefinition = "TEXT") stores this as a TEXT column in MySQL
    // instead of VARCHAR — TEXT can hold much longer strings (up to 65,535 characters)
    @Column(columnDefinition = "TEXT")
    private String content;

    // Star rating from 1 to 5 — stored as an INT in MySQL
    private int rating;

    // The average of all review ratings — recalculated every time a review is saved
    private double averageRating;

    // The date and time the review was created — set automatically by @PrePersist below
    private LocalDateTime createdAt;

    // The language the review was written in (e.g. "en", "fr") — used for translation
    private String language;

    // The reason the user left the review — chosen from a dropdown in the frontend
    // Examples: "Quality of work delivered", "Communication & responsiveness"
    private String reviewReason;

    // @PrePersist means: "run this method automatically just before saving to the database"
    // This ensures createdAt is always set to the current time when a review is created
=======
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

>>>>>>> b0248089 (fonctions (pas encore integration user))
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

<<<<<<< HEAD
    // ── Getters ──────────────────────────────────────────────────────
    // Getters allow other classes to READ the private fields of this object
    public Long getId() { return id; }
    public String getAuthor() { return author; }
    public String getContent() { return content; }
    public int getRating() { return rating; }
    public double getAverageRating() { return averageRating; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public String getLanguage() { return language; }
    public String getReviewReason() { return reviewReason; }

    // ── Setters ──────────────────────────────────────────────────────
    // Setters allow other classes to WRITE (change) the private fields of this object
    // Spring uses these automatically when converting incoming JSON into a Review object
    public void setId(Long id) { this.id = id; }
    public void setAuthor(String author) { this.author = author; }
    public void setContent(String content) { this.content = content; }
    public void setRating(int rating) { this.rating = rating; }
    public void setAverageRating(double averageRating) { this.averageRating = averageRating; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setLanguage(String language) { this.language = language; }
    public void setReviewReason(String reviewReason) { this.reviewReason = reviewReason; }
=======
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
>>>>>>> b0248089 (fonctions (pas encore integration user))
}