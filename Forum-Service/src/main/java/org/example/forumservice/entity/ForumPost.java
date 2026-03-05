package org.example.forumservice.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

// @Entity tells Spring/Hibernate: "this Java class maps to a table in the database"
@Entity

// The table in MySQL will be named "forum_posts"
@Table(name = "forum_posts")
public class ForumPost {

    // Primary key — auto-incremented by MySQL (1, 2, 3...)
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // The name of the user who created the post
    private String author;

    // The title/subject of the forum post
    private String title;

    // The main body text of the post — stored as TEXT (not VARCHAR) to support long content
    @Column(columnDefinition = "TEXT")
    private String content;

    // Stores the URL path to an uploaded image file
    // Example value: "/uploads/abc123_photo.jpg"
    // The actual file is stored on disk in the uploads/ folder
    private String imageUrl;

    // Stores the URL path to an uploaded audio file (MP3, WAV, etc.)
    // Example value: "/uploads/abc123_audio.mp3"
    private String audioUrl;

    // Stores the YouTube or Vimeo embed URL (converted from the original watch URL)
    // Example value: "https://www.youtube.com/embed/dQw4w9WgXcQ"
    private String videoUrl;

    // The date and time the post was created — set automatically by @PrePersist
    private LocalDateTime createdAt;

    // Stores emoji reactions as a JSON string in the database
    // Example value: {"👍":3,"❤️":1,"🔥":2}
    // We use TEXT because JSON strings can be long
    @Column(columnDefinition = "TEXT")
    private String reactions;

    // A post can have many replies — this creates a one-to-many relationship
    // mappedBy = "post" means the Reply entity owns this relationship (has the foreign key)
    // cascade = ALL means: if you delete a post, all its replies are deleted too
    // orphanRemoval = true means: if a reply is removed from this list, it's deleted from DB too
    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Reply> replies = new ArrayList<>();

    // @PrePersist runs this method automatically just before inserting into the database
    // Sets the creation timestamp and initializes reactions to an empty JSON object "{}"
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (reactions == null) reactions = "{}"; // Start with no reactions
    }

    // ── Getters (read the fields) ─────────────────────────────────────
    public Long getId() { return id; }
    public String getAuthor() { return author; }
    public String getTitle() { return title; }
    public String getContent() { return content; }
    public String getImageUrl() { return imageUrl; }
    public String getAudioUrl() { return audioUrl; }
    public String getVideoUrl() { return videoUrl; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public String getReactions() { return reactions; }
    public List<Reply> getReplies() { return replies; }

    // ── Setters (write the fields) ────────────────────────────────────
    public void setId(Long id) { this.id = id; }
    public void setAuthor(String author) { this.author = author; }
    public void setTitle(String title) { this.title = title; }
    public void setContent(String content) { this.content = content; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public void setAudioUrl(String audioUrl) { this.audioUrl = audioUrl; }
    public void setVideoUrl(String videoUrl) { this.videoUrl = videoUrl; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setReactions(String reactions) { this.reactions = reactions; }
    public void setReplies(List<Reply> replies) { this.replies = replies; }
}