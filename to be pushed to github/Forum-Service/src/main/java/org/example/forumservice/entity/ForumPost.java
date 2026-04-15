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

    // Stores the ID of the user who created this post (from JWT)
    private Long userId;

    private String author;
    private String title;

    @Column(columnDefinition = "TEXT")
    private String content;

    private String imageUrl;
    private String audioUrl;
    private String videoUrl;

    private LocalDateTime createdAt;

    @Column(columnDefinition = "TEXT")
    private String reactions;

    @Column(nullable = false)
    private boolean bookmarked = false;

    @Column(nullable = false)
    private boolean edited = false;

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Reply> replies = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (reactions == null) reactions = "{}";
    }

    // ── Getters ───────────────────────────────────────────────────────
    public Long getId()                  { return id; }
    public Long getUserId()              { return userId; }
    public String getAuthor()            { return author; }
    public String getTitle()             { return title; }
    public String getContent()           { return content; }
    public String getImageUrl()          { return imageUrl; }
    public String getAudioUrl()          { return audioUrl; }
    public String getVideoUrl()          { return videoUrl; }
    public LocalDateTime getCreatedAt()  { return createdAt; }
    public String getReactions()         { return reactions; }
    public boolean isBookmarked()        { return bookmarked; }
    public boolean isEdited()            { return edited; }
    public List<Reply> getReplies()      { return replies; }

    // ── Setters ───────────────────────────────────────────────────────
    public void setId(Long id)                         { this.id = id; }
    public void setUserId(Long userId)                 { this.userId = userId; }
    public void setAuthor(String author)               { this.author = author; }
    public void setTitle(String title)                 { this.title = title; }
    public void setContent(String content)             { this.content = content; }
    public void setImageUrl(String imageUrl)           { this.imageUrl = imageUrl; }
    public void setAudioUrl(String audioUrl)           { this.audioUrl = audioUrl; }
    public void setVideoUrl(String videoUrl)           { this.videoUrl = videoUrl; }
    public void setCreatedAt(LocalDateTime createdAt)  { this.createdAt = createdAt; }
    public void setReactions(String reactions)         { this.reactions = reactions; }
    public void setBookmarked(boolean bookmarked)      { this.bookmarked = bookmarked; }
    public void setEdited(boolean edited)              { this.edited = edited; }
    public void setReplies(List<Reply> replies)        { this.replies = replies; }
}