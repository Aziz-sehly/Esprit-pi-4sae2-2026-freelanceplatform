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

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // Getters
    public Long getId() { return id; }
    public String getAuthor() { return author; }
    public String getContent() { return content; }
    public int getRating() { return rating; }
    public double getAverageRating() { return averageRating; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public String getLanguage() { return language; }

    // Setters
    public void setId(Long id) { this.id = id; }
    public void setAuthor(String author) { this.author = author; }
    public void setContent(String content) { this.content = content; }
    public void setRating(int rating) { this.rating = rating; }
    public void setAverageRating(double averageRating) { this.averageRating = averageRating; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setLanguage(String language) { this.language = language; }
}