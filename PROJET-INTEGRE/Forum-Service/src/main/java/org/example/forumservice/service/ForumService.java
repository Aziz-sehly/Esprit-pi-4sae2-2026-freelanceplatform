package org.example.forumservice.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.forumservice.entity.ForumPost;
import org.example.forumservice.entity.PostEditHistory;
import org.example.forumservice.entity.Reply;
import org.example.forumservice.repository.ForumPostRepository;
import org.example.forumservice.repository.PostEditHistoryRepository;
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

@Service
public class ForumService {

    @Autowired
    private ForumPostRepository postRepository;

    @Autowired
    private ReplyRepository replyRepository;

    // NEW: injected for saving edit history snapshots
    @Autowired
    private PostEditHistoryRepository editHistoryRepository;

    // Jackson tool for reading/writing the emoji reactions JSON string
    private final ObjectMapper objectMapper = new ObjectMapper();

    // Folder on disk where uploaded images and audio files are saved
    private static final String UPLOAD_DIR = "uploads/";

    // ── Basic CRUD ────────────────────────────────────────────────────

    public List<ForumPost> getAllPosts() {
        return postRepository.findAll();
    }

    public Optional<ForumPost> getPostById(Long id) {
        return postRepository.findById(id);
    }

    public ForumPost createPost(ForumPost post) {
        return postRepository.save(post);
    }

    // Creates a new post with optional image, audio, and/or video URL
    public ForumPost createPostWithImage(String author, String title, String content,
                                         MultipartFile image, MultipartFile audio, String videoUrl) throws IOException {
        ForumPost post = new ForumPost();
        post.setAuthor(author);
        post.setTitle(title);
        post.setContent(content);

        Path uploadPath = Paths.get(UPLOAD_DIR);
        if (!Files.exists(uploadPath)) Files.createDirectories(uploadPath);

        if (image != null && !image.isEmpty()) {
            String filename = UUID.randomUUID() + "_" + image.getOriginalFilename();
            Files.copy(image.getInputStream(), uploadPath.resolve(filename));
            post.setImageUrl("/uploads/" + filename);
        }

        if (audio != null && !audio.isEmpty()) {
            String audioFilename = UUID.randomUUID() + "_" + audio.getOriginalFilename();
            Files.copy(audio.getInputStream(), uploadPath.resolve(audioFilename));
            post.setAudioUrl("/uploads/" + audioFilename);
        }

        if (videoUrl != null && !videoUrl.isBlank()) {
            post.setVideoUrl(convertToEmbedUrl(videoUrl));
        }

        return postRepository.save(post);
    }

    // Converts a YouTube/Vimeo watch URL to an embeddable iframe URL
    private String convertToEmbedUrl(String url) {
        if (url.contains("youtube.com/watch")) {
            String videoId = url.replaceAll(".*[?&]v=([^&]+).*", "$1");
            return "https://www.youtube.com/embed/" + videoId;
        }
        if (url.contains("youtu.be/")) {
            String videoId = url.replaceAll(".*youtu\\.be/([^?]+).*", "$1");
            return "https://www.youtube.com/embed/" + videoId;
        }
        if (url.contains("vimeo.com/")) {
            String videoId = url.replaceAll(".*vimeo\\.com/(\\d+).*", "$1");
            return "https://player.vimeo.com/video/" + videoId;
        }
        return url;
    }

    /**
     * Updates an existing post's text fields (author, title, content).
     * SAVES A HISTORY SNAPSHOT before applying the changes so that
     * GET /api/posts/{id}/history can show the full edit timeline.
     * Also marks the post as edited so the frontend can display the "edited" badge.
     */
    public ForumPost updatePost(Long id, ForumPost updated) {
        return postRepository.findById(id).map(post -> {

            // ── NEW: Save history snapshot BEFORE applying changes ────
            PostEditHistory history = new PostEditHistory();
            history.setPostId(id);
            history.setOldTitle(post.getTitle());
            history.setOldContent(post.getContent());
            history.setNewTitle(updated.getTitle());
            history.setNewContent(updated.getContent());
            history.setEditedBy(updated.getAuthor());
            editHistoryRepository.save(history);

            // Apply the new values
            post.setAuthor(updated.getAuthor());
            post.setTitle(updated.getTitle());
            post.setContent(updated.getContent());
            post.setEdited(true); // NEW: mark as edited

            return postRepository.save(post);
        }).orElseThrow(() -> new RuntimeException("Post not found: " + id));
    }

    public void deletePost(Long id) {
        postRepository.deleteById(id);
    }

    // ── NEW: Edit history ─────────────────────────────────────────────
    // Returns all edit snapshots for a post, newest first.
    // Called by GET /api/posts/{id}/history
    public List<PostEditHistory> getPostHistory(Long postId) {
        return editHistoryRepository.findByPostIdOrderByEditedAtDesc(postId);
    }

    // ── NEW: Bookmark toggle ──────────────────────────────────────────
    public ForumPost toggleBookmark(Long id) {
        ForumPost post = postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Post not found: " + id));
        post.setBookmarked(!post.isBookmarked());
        return postRepository.save(post);
    }

    // ── NEW: Search posts ─────────────────────────────────────────────
    public List<ForumPost> searchPosts(String query) {
        if (query == null || query.isBlank()) return postRepository.findAll();
        return postRepository.searchPosts(query.trim());
    }

    // ── Reply methods ─────────────────────────────────────────────────

    public Reply addReply(Long postId, Reply reply) {
        ForumPost post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found: " + postId));
        reply.setPost(post);
        return replyRepository.save(reply);
    }

    public List<Reply> getRepliesByPost(Long postId) {
        return replyRepository.findByPostId(postId);
    }

    public void deleteReply(Long replyId) {
        replyRepository.deleteById(replyId);
    }

    public Reply likeReply(Long replyId) {
        Reply reply = replyRepository.findById(replyId)
                .orElseThrow(() -> new RuntimeException("Reply not found: " + replyId));
        reply.setLikeCount(reply.getLikeCount() + 1);
        return replyRepository.save(reply);
    }

    // ── Emoji reactions ───────────────────────────────────────────────

    public ForumPost addReaction(Long postId, String emoji) throws Exception {
        ForumPost post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found: " + postId));

        Map<String, Integer> reactions = objectMapper.readValue(
                post.getReactions() != null ? post.getReactions() : "{}",
                new TypeReference<>() {}
        );
        reactions.merge(emoji, 1, Integer::sum);
        post.setReactions(objectMapper.writeValueAsString(reactions));
        return postRepository.save(post);
    }
}