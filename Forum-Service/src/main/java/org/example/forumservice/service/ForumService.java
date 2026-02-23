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

@Service
public class ForumService {

    @Autowired
    private ForumPostRepository postRepository;

    @Autowired
    private ReplyRepository replyRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private static final String UPLOAD_DIR = "uploads/";

    public List<ForumPost> getAllPosts() {
        return postRepository.findAll();
    }

    public Optional<ForumPost> getPostById(Long id) {
        return postRepository.findById(id);
    }

    public ForumPost createPost(ForumPost post) {
        return postRepository.save(post);
    }

    public ForumPost createPostWithImage(String author, String title, String content, MultipartFile image) throws IOException {
        ForumPost post = new ForumPost();
        post.setAuthor(author);
        post.setTitle(title);
        post.setContent(content);

        if (image != null && !image.isEmpty()) {
            String filename = UUID.randomUUID() + "_" + image.getOriginalFilename();
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) Files.createDirectories(uploadPath);
            Files.copy(image.getInputStream(), uploadPath.resolve(filename));
            post.setImageUrl("/uploads/" + filename);
        }

        return postRepository.save(post);
    }

    public ForumPost updatePost(Long id, ForumPost updated) {
        return postRepository.findById(id).map(post -> {
            post.setAuthor(updated.getAuthor());
            post.setTitle(updated.getTitle());
            post.setContent(updated.getContent());
            return postRepository.save(post);
        }).orElseThrow(() -> new RuntimeException("Post not found: " + id));
    }

    public void deletePost(Long id) {
        postRepository.deleteById(id);
    }

    // Replies
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

    // Emoji reactions
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