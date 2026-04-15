package org.example.forumservice.controller;

import org.example.forumservice.entity.ForumPost;
import org.example.forumservice.entity.PostEditHistory;
import org.example.forumservice.entity.Reply;
import org.example.forumservice.security.JwtUtils;
import org.example.forumservice.service.ForumService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/posts")
@CrossOrigin(origins = "*")
public class ForumController {

    @Autowired
    private ForumService forumService;

    @Autowired
    private JwtUtils jwtUtils;

    // ── GET /api/posts ────────────────────────────────────────────────
    @GetMapping
    public List<ForumPost> getAllPosts() {
        return forumService.getAllPosts();
    }

    // ── GET /api/posts/{id} ───────────────────────────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<ForumPost> getPostById(@PathVariable Long id) {
        return forumService.getPostById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ── GET /api/posts/search?q=... ───────────────────────────────────
    @GetMapping("/search")
    public List<ForumPost> searchPosts(@RequestParam(defaultValue = "") String q) {
        return forumService.searchPosts(q);
    }

    // ── GET /api/posts/{id}/history ───────────────────────────────────
    @GetMapping("/{id}/history")
    public ResponseEntity<List<PostEditHistory>> getPostHistory(@PathVariable Long id) {
        return ResponseEntity.ok(forumService.getPostHistory(id));
    }

    /**
     * POST /api/posts
     * Requires: Authorization: Bearer <token>
     * The author is resolved from the JWT — the caller no longer supplies it.
     */
    @PostMapping(consumes = {"multipart/form-data"})
    public ResponseEntity<?> createPost(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam String title,
            @RequestParam String content,
            @RequestParam(required = false) MultipartFile image,
            @RequestParam(required = false) MultipartFile audio,
            @RequestParam(required = false) String videoUrl) {
        try {
            Long userId = extractUserId(authHeader);
            ForumPost post = forumService.createPostWithImage(userId, title, content, image, audio, videoUrl);
            return ResponseEntity.ok(post);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    // ── PUT /api/posts/{id} ───────────────────────────────────────────
    @PutMapping("/{id}")
    public ResponseEntity<ForumPost> updatePost(@PathVariable Long id, @RequestBody ForumPost post) {
        try {
            return ResponseEntity.ok(forumService.updatePost(id, post));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // ── DELETE /api/posts/{id} ────────────────────────────────────────
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePost(@PathVariable Long id) {
        forumService.deletePost(id);
        return ResponseEntity.noContent().build();
    }

    // ── POST /api/posts/{id}/bookmark ─────────────────────────────────
    @PostMapping("/{id}/bookmark")
    public ResponseEntity<ForumPost> toggleBookmark(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(forumService.toggleBookmark(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * POST /api/posts/{id}/replies
     * Requires: Authorization: Bearer <token>
     * Body (JSON): { "content": "your reply text" }
     * The author is resolved from the JWT.
     */
    @PostMapping("/{id}/replies")
    public ResponseEntity<?> addReply(
            @PathVariable Long id,
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, String> body) {
        try {
            Long userId = extractUserId(authHeader);
            String content = body.get("content");
            if (content == null || content.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "content is required"));
            }
            return ResponseEntity.ok(forumService.addReply(id, userId, content));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // ── GET /api/posts/{id}/replies ───────────────────────────────────
    @GetMapping("/{id}/replies")
    public List<Reply> getReplies(@PathVariable Long id) {
        return forumService.getRepliesByPost(id);
    }

    // ── DELETE /api/posts/replies/{replyId} ───────────────────────────
    @DeleteMapping("/replies/{replyId}")
    public ResponseEntity<Void> deleteReply(@PathVariable Long replyId) {
        forumService.deleteReply(replyId);
        return ResponseEntity.noContent().build();
    }

    // ── POST /api/posts/replies/{id}/like ─────────────────────────────
    @PostMapping("/replies/{id}/like")
    public ResponseEntity<Reply> likeReply(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(forumService.likeReply(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // ── POST /api/posts/{id}/react ────────────────────────────────────
    @PostMapping("/{id}/react")
    public ResponseEntity<ForumPost> addReaction(
            @PathVariable Long id,
            @RequestParam String emoji) {
        try {
            return ResponseEntity.ok(forumService.addReaction(id, emoji));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // ── Private helper ────────────────────────────────────────────────

    /**
     * Strips "Bearer " from the Authorization header and extracts the userId.
     * Throws IllegalArgumentException (→ 401) if the header is missing or malformed.
     */
    private Long extractUserId(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new IllegalArgumentException("Missing or invalid Authorization header");
        }
        return jwtUtils.extractUserId(authHeader.substring(7));
    }
}