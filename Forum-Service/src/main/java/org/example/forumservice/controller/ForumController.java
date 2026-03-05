package org.example.forumservice.controller;

import org.example.forumservice.entity.ForumPost;
import org.example.forumservice.entity.Reply;
import org.example.forumservice.service.ForumService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

// @RestController: this class handles HTTP requests and returns JSON responses
@RestController

// All endpoints in this class start with /api/posts
@RequestMapping("/api/posts")

// Allows requests from any origin — needed so Angular (localhost:4200) can call this API
@CrossOrigin(origins = "*")
public class ForumController {

    // Spring automatically provides the ForumService instance
    @Autowired
    private ForumService forumService;

    // ── GET /api/posts ────────────────────────────────────────────────
    // Returns ALL forum posts as a JSON array
    // Example Postman: GET http://localhost:8082/api/posts
    @GetMapping
    public List<ForumPost> getAllPosts() {
        return forumService.getAllPosts();
    }

    // ── GET /api/posts/{id} ───────────────────────────────────────────
    // Returns one post by its ID
    // Returns 200 OK with the post, or 404 Not Found if it doesn't exist
    // Example Postman: GET http://localhost:8082/api/posts/5
    @GetMapping("/{id}")
    public ResponseEntity<ForumPost> getPostById(@PathVariable Long id) {
        return forumService.getPostById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ── POST /api/posts ───────────────────────────────────────────────
    // Creates a new forum post — accepts multipart/form-data (not JSON)
    // because the request may include file uploads (image, audio)
    //
    // consumes = "multipart/form-data" tells Spring this endpoint expects a form, not JSON
    // @RequestParam reads individual fields from the form
    // MultipartFile represents an uploaded file
    // required = false means the field is optional (posts don't need image/audio/video)
    //
    // Example Postman: POST http://localhost:8082/api/posts
    //   Form fields: author="Alice", title="Hello", content="World"
    //   Optional file fields: image, audio
    //   Optional text field: videoUrl = "https://www.youtube.com/watch?v=abc"
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
            return ResponseEntity.ok(post); // 200 OK with the created post
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build(); // 500 if something went wrong
        }
    }

    // ── PUT /api/posts/{id} ───────────────────────────────────────────
    // Updates an existing post's text content (author, title, content)
    // Uses @RequestBody because this is a JSON request (no file uploads in edit)
    // Example Postman: PUT http://localhost:8082/api/posts/5
    // Body (JSON): { "author": "Alice", "title": "Updated Title", "content": "New content" }
    @PutMapping("/{id}")
    public ResponseEntity<ForumPost> updatePost(@PathVariable Long id, @RequestBody ForumPost post) {
        try {
            return ResponseEntity.ok(forumService.updatePost(id, post));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build(); // 404 if post doesn't exist
        }
    }

    // ── DELETE /api/posts/{id} ────────────────────────────────────────
    // Deletes a post and all its replies (used by admin in back office)
    // Returns 204 No Content (success, nothing to return)
    // Example Postman: DELETE http://localhost:8082/api/posts/5
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePost(@PathVariable Long id) {
        forumService.deletePost(id);
        return ResponseEntity.noContent().build(); // 204 No Content
    }

    // ── POST /api/posts/{id}/replies ──────────────────────────────────
    // Adds a reply to a specific post
    // @RequestBody converts the incoming JSON into a Reply object
    // Example Postman: POST http://localhost:8082/api/posts/5/replies
    // Body (JSON): { "author": "Bob", "content": "I agree!" }
    @PostMapping("/{id}/replies")
    public ResponseEntity<Reply> addReply(@PathVariable Long id, @RequestBody Reply reply) {
        try {
            return ResponseEntity.ok(forumService.addReply(id, reply));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build(); // 404 if the parent post doesn't exist
        }
    }

    // ── GET /api/posts/{id}/replies ───────────────────────────────────
    // Returns all replies for a specific post
    // Example Postman: GET http://localhost:8082/api/posts/5/replies
    @GetMapping("/{id}/replies")
    public List<Reply> getReplies(@PathVariable Long id) {
        return forumService.getRepliesByPost(id);
    }

    // ── DELETE /api/posts/replies/{replyId} ───────────────────────────
    // Deletes a specific reply by its own ID (used by admin)
    // Note: the URL is /api/posts/replies/{replyId} not /api/posts/{id}/replies/{replyId}
    // Example Postman: DELETE http://localhost:8082/api/posts/replies/12
    @DeleteMapping("/replies/{replyId}")
    public ResponseEntity<Void> deleteReply(@PathVariable Long replyId) {
        forumService.deleteReply(replyId);
        return ResponseEntity.noContent().build();
    }

    // ── POST /api/posts/{id}/react ────────────────────────────────────
    // Adds an emoji reaction to a post (increments the count by 1)
    // @RequestParam reads the emoji from the URL query string: ?emoji=👍
    // Example Postman: POST http://localhost:8082/api/posts/5/react?emoji=👍
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