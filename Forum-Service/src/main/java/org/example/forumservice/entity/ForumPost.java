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

    // URL path to an uploaded image file — e.g. "/uploads/abc123_photo.jpg"
    private String imageUrl;

    // URL path to an uploaded audio file — e.g. "/uploads/abc123_audio.mp3"
    private String audioUrl;

    // YouTube or Vimeo embed URL — e.g. "https://www.youtube.com/embed/dQw4w9WgXcQ"
    private String videoUrl;

    private LocalDateTime createdAt;

    // Emoji reactions stored as a JSON string — e.g. {"👍":3,"❤️":1,"🔥":2}
    @Column(columnDefinition = "TEXT")
    private String reactions;

    // Global bookmark flag — not tied to any specific user.
    @Column(nullable = false)
    private boolean bookmarked = false;

    // NEW: Whether this post has ever been edited.
    // Set to true by updatePost() so the frontend can show an "edited" badge.
    // Hibernate adds an "edited" TINYINT(1) column via ddl-auto=update
    @Column(nullable = false)
    private boolean edited = false;

    // One post → many replies. Cascade ALL so deleting a post removes its replies too.
    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Reply> replies = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (reactions == null) reactions = "{}";
    }

    // ── Getters ───────────────────────────────────────────────────────
    public Long getId()                  { return id; }
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