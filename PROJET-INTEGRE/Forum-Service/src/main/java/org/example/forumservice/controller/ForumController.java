package org.example.forumservice.controller;

import org.example.forumservice.entity.ForumPost;
import org.example.forumservice.entity.PostEditHistory;
import org.example.forumservice.entity.Reply;
import org.example.forumservice.service.ForumService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/posts")
@CrossOrigin(origins = "*")
public class ForumController {

    @Autowired
    private ForumService forumService;

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

    // ── NEW: GET /api/posts/{id}/history ─────────────────────────────
    // Returns all edit history entries for a post, newest-first.
    // Each entry contains oldTitle, newTitle, oldContent, newContent,
    // editedBy, and editedAt so the frontend can render a full diff timeline.
    // Example: GET http://localhost:8082/api/posts/5/history
    @GetMapping("/{id}/history")
    public ResponseEntity<List<PostEditHistory>> getPostHistory(@PathVariable Long id) {
        List<PostEditHistory> history = forumService.getPostHistory(id);
        return ResponseEntity.ok(history);
    }

    // ── POST /api/posts ───────────────────────────────────────────────
    @PostMapping(consumes = {"multipart/form-data"})
    public ResponseEntity<ForumPost> createPost(
            @RequestParam String author,
            @RequestParam String title,
            @RequestParam String content,
            @RequestParam(required = false) MultipartFile image,
            @RequestParam(required = false) MultipartFile audio,
            @RequestParam(required = false) String videoUrl) {
        try {
            ForumPost post = forumService.createPostWithImage(author, title, content, image, audio, videoUrl);
            return ResponseEntity.ok(post);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // ── PUT /api/posts/{id} ───────────────────────────────────────────
    // Saves a history snapshot then applies the update.
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

    // ── POST /api/posts/{id}/replies ──────────────────────────────────
    @PostMapping("/{id}/replies")
    public ResponseEntity<Reply> addReply(@PathVariable Long id, @RequestBody Reply reply) {
        try {
            return ResponseEntity.ok(forumService.addReply(id, reply));
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
}