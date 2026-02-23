package org.example.forumservice.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "forum_posts")
public class ForumPost {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String author;
    private String title;

    @Column(columnDefinition = "TEXT")
    private String content;

    private String imageUrl;
    private LocalDateTime createdAt;

    @Column(columnDefinition = "TEXT")
    private String reactions;

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Reply> replies = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (reactions == null) reactions = "{}";
    }

    // Getters
    public Long getId() { return id; }
    public String getAuthor() { return author; }
    public String getTitle() { return title; }
    public String getContent() { return content; }
    public String getImageUrl() { return imageUrl; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public String getReactions() { return reactions; }
    public List<Reply> getReplies() { return replies; }

    // Setters
    public void setId(Long id) { this.id = id; }
    public void setAuthor(String author) { this.author = author; }
    public void setTitle(String title) { this.title = title; }
    public void setContent(String content) { this.content = content; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setReactions(String reactions) { this.reactions = reactions; }
    public void setReplies(List<Reply> replies) { this.replies = replies; }
}