package org.example.forumservice.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.forumservice.entity.ForumPost;
import org.example.forumservice.entity.Reply;
import org.example.forumservice.repository.ForumPostRepository;
import org.example.forumservice.repository.ReplyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

// @Service marks this as the business logic layer
// The controller calls these methods; this class calls the repository
@Service
public class ForumService {

    // Spring injects the repository — no need for "new ForumPostRepository()"
    @Autowired
    private ForumPostRepository postRepository;

    @Autowired
    private ReplyRepository replyRepository;

    // ObjectMapper is Jackson's tool for converting between Java objects and JSON strings
    // Used here to read/write the emoji reactions stored as JSON in the database
    private final ObjectMapper objectMapper = new ObjectMapper();

    // The folder where uploaded images and audio files are saved on disk
    // This is a relative path — it creates an "uploads" folder next to where the app runs
    private static final String UPLOAD_DIR = "uploads/";

    // Returns all forum posts — SELECT * FROM forum_posts
    public List<ForumPost> getAllPosts() {
        return postRepository.findAll();
    }

    // Returns one post by ID, or empty if not found
    public Optional<ForumPost> getPostById(Long id) {
        return postRepository.findById(id);
    }

    // Simple create without file handling (kept for internal use)
    public ForumPost createPost(ForumPost post) {
        return postRepository.save(post);
    }

    // Creates a new post with optional image, audio, and/or video URL
    // MultipartFile is Spring's type for handling file uploads from HTML forms
    public ForumPost createPostWithImage(String author, String title, String content,
                                         MultipartFile image, MultipartFile audio, String videoUrl) throws IOException {
        // Create a new empty post object and fill in the text fields
        ForumPost post = new ForumPost();
        post.setAuthor(author);
        post.setTitle(title);
        post.setContent(content);

        // Make sure the uploads/ directory exists on disk — create it if it doesn't
        Path uploadPath = Paths.get(UPLOAD_DIR);
        if (!Files.exists(uploadPath)) Files.createDirectories(uploadPath);

        // ── Handle image upload ───────────────────────────────────────
        if (image != null && !image.isEmpty()) {
            // UUID.randomUUID() generates a unique ID (e.g. "a3f2b1c4-...")
            // Prepending it to the filename prevents name collisions if two users upload "photo.jpg"
            String filename = UUID.randomUUID() + "_" + image.getOriginalFilename();
            // Copy the uploaded file bytes from memory to disk
            Files.copy(image.getInputStream(), uploadPath.resolve(filename));
            // Store the URL path so the frontend can load it: http://localhost:8082/uploads/filename.jpg
            post.setImageUrl("/uploads/" + filename);
        }

        // ── Handle audio upload ───────────────────────────────────────
        if (audio != null && !audio.isEmpty()) {
            // Same approach as image — unique filename to avoid collisions
            String audioFilename = UUID.randomUUID() + "_" + audio.getOriginalFilename();
            Files.copy(audio.getInputStream(), uploadPath.resolve(audioFilename));
            post.setAudioUrl("/uploads/" + audioFilename);
        }

        // ── Handle YouTube/Vimeo URL ──────────────────────────────────
        // Convert the user's watch URL to an embeddable URL before saving
        // e.g. "https://www.youtube.com/watch?v=abc" → "https://www.youtube.com/embed/abc"
        if (videoUrl != null && !videoUrl.isBlank()) {
            post.setVideoUrl(convertToEmbedUrl(videoUrl));
        }

        // Save everything to the database and return the saved post (with its generated ID)
        return postRepository.save(post);
    }

    // Converts a standard YouTube or Vimeo URL into an embed URL
    // An "embed URL" is the special URL format used inside <iframe> tags
    private String convertToEmbedUrl(String url) {
        // YouTube standard URL: https://www.youtube.com/watch?v=VIDEO_ID
        // Extract VIDEO_ID using a regex and build the embed URL
        if (url.contains("youtube.com/watch")) {
            String videoId = url.replaceAll(".*[?&]v=([^&]+).*", "$1");
            return "https://www.youtube.com/embed/" + videoId;
        }
        // YouTube short URL: https://youtu.be/VIDEO_ID
        if (url.contains("youtu.be/")) {
            String videoId = url.replaceAll(".*youtu\\.be/([^?]+).*", "$1");
            return "https://www.youtube.com/embed/" + videoId;
        }
        // Vimeo URL: https://vimeo.com/VIDEO_ID
        if (url.contains("vimeo.com/")) {
            String videoId = url.replaceAll(".*vimeo\\.com/(\\d+).*", "$1");
            return "https://player.vimeo.com/video/" + videoId;
        }
        // If URL is already in embed format or unrecognized, return it as-is
        return url;
    }

    // Updates the text fields of an existing post
    // Note: image/audio/video are not updated here — only author, title, content
    public ForumPost updatePost(Long id, ForumPost updated) {
        return postRepository.findById(id).map(post -> {
            post.setAuthor(updated.getAuthor());
            post.setTitle(updated.getTitle());
            post.setContent(updated.getContent());
            return postRepository.save(post);
        }).orElseThrow(() -> new RuntimeException("Post not found: " + id));
    }

    // Deletes a post and all its replies (cascade delete handles the replies automatically)
    public void deletePost(Long id) {
        postRepository.deleteById(id);
    }

    // ── Reply methods ─────────────────────────────────────────────────

    // Adds a reply to a specific post
    // First finds the parent post, links the reply to it, then saves the reply
    public Reply addReply(Long postId, Reply reply) {
        ForumPost post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found: " + postId));
        // Link the reply to its parent post (sets the post_id foreign key)
        reply.setPost(post);
        return replyRepository.save(reply);
    }

    // Returns all replies for a specific post
    // Uses the custom findByPostId() method from ReplyRepository
    public List<Reply> getRepliesByPost(Long postId) {
        return replyRepository.findByPostId(postId);
    }

    // Deletes a single reply by ID
    public void deleteReply(Long replyId) {
        replyRepository.deleteById(replyId);
    }

    // ── Emoji reactions ───────────────────────────────────────────────

    // Adds one emoji reaction to a post
    // Reactions are stored as a JSON string in the database: {"👍":3,"❤️":1}
    public ForumPost addReaction(Long postId, String emoji) throws Exception {
        ForumPost post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found: " + postId));

        // Parse the JSON string from the database into a Java Map
        // TypeReference<Map<String, Integer>> tells Jackson: "this JSON is a map of string → integer"
        // If reactions is null, use "{}" (empty JSON object) as the default
        Map<String, Integer> reactions = objectMapper.readValue(
                post.getReactions() != null ? post.getReactions() : "{}",
                new TypeReference<>() {}
        );

        // Add 1 to the count for this emoji
        // reactions.merge(key, 1, Integer::sum) means:
        //   - if the emoji already exists: add 1 to its current value
        //   - if it doesn't exist yet: set it to 1
        reactions.merge(emoji, 1, Integer::sum);

        // Convert the updated Map back to a JSON string and save it to the database
        post.setReactions(objectMapper.writeValueAsString(reactions));
        return postRepository.save(post);
    }
}