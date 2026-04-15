package org.example.forumservice.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.forumservice.client.UserServiceClient;
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

    @Autowired
    private PostEditHistoryRepository editHistoryRepository;

    @Autowired
    private UserServiceClient userServiceClient;

    private final ObjectMapper objectMapper = new ObjectMapper();
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

    /**
     * Creates a post linked to a real user.
     * userId comes from the JWT token (extracted by the controller).
     * The author name is resolved by calling the User Service.
     */
    public ForumPost createPostWithImage(Long userId, String title, String content,
                                         MultipartFile image, MultipartFile audio,
                                         String videoUrl) throws IOException {
        ForumPost post = new ForumPost();
        post.setUserId(userId);
        post.setAuthor(userServiceClient.getUserFullName(userId));
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

    public ForumPost updatePost(Long id, ForumPost updated) {
        return postRepository.findById(id).map(post -> {

            PostEditHistory history = new PostEditHistory();
            history.setPostId(id);
            history.setOldTitle(post.getTitle());
            history.setOldContent(post.getContent());
            history.setNewTitle(updated.getTitle());
            history.setNewContent(updated.getContent());
            history.setEditedBy(post.getAuthor()); // use the stored real name
            editHistoryRepository.save(history);

            post.setTitle(updated.getTitle());
            post.setContent(updated.getContent());
            post.setEdited(true);

            return postRepository.save(post);
        }).orElseThrow(() -> new RuntimeException("Post not found: " + id));
    }

    public void deletePost(Long id) {
        postRepository.deleteById(id);
    }

    public List<PostEditHistory> getPostHistory(Long postId) {
        return editHistoryRepository.findByPostIdOrderByEditedAtDesc(postId);
    }

    public ForumPost toggleBookmark(Long id) {
        ForumPost post = postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Post not found: " + id));
        post.setBookmarked(!post.isBookmarked());
        return postRepository.save(post);
    }

    public List<ForumPost> searchPosts(String query) {
        if (query == null || query.isBlank()) return postRepository.findAll();
        return postRepository.searchPosts(query.trim());
    }

    /**
     * Adds a reply linked to a real user.
     * userId comes from the JWT token (extracted by the controller).
     */
    public Reply addReply(Long postId, Long userId, String content) {
        ForumPost post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found: " + postId));
        Reply reply = new Reply();
        reply.setUserId(userId);
        reply.setAuthor(userServiceClient.getUserFullName(userId));
        reply.setContent(content);
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