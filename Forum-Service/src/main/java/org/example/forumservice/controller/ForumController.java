package org.example.forumservice.controller;

import org.example.forumservice.entity.ForumPost;
<<<<<<< HEAD
=======
import org.example.forumservice.entity.PostEditHistory;
>>>>>>> b0248089 (fonctions (pas encore integration user))
import org.example.forumservice.entity.Reply;
import org.example.forumservice.service.ForumService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

<<<<<<< HEAD
// @RestController: this class handles HTTP requests and returns JSON responses
@RestController

// All endpoints in this class start with /api/posts
@RequestMapping("/api/posts")

// Allows requests from any origin — needed so Angular (localhost:4200) can call this API
@CrossOrigin(origins = "*")
public class ForumController {

    // Spring automatically provides the ForumService instance
=======
@RestController
@RequestMapping("/api/posts")
@CrossOrigin(origins = "*")
public class ForumController {

>>>>>>> b0248089 (fonctions (pas encore integration user))
    @Autowired
    private ForumService forumService;

    // ── GET /api/posts ────────────────────────────────────────────────
<<<<<<< HEAD
    // Returns ALL forum posts as a JSON array
    // Example Postman: GET http://localhost:8082/api/posts
=======
>>>>>>> b0248089 (fonctions (pas encore integration user))
    @GetMapping
    public List<ForumPost> getAllPosts() {
        return forumService.getAllPosts();
    }

    // ── GET /api/posts/{id} ───────────────────────────────────────────
<<<<<<< HEAD
    // Returns one post by its ID
    // Returns 200 OK with the post, or 404 Not Found if it doesn't exist
    // Example Postman: GET http://localhost:8082/api/posts/5
=======
>>>>>>> b0248089 (fonctions (pas encore integration user))
    @GetMapping("/{id}")
    public ResponseEntity<ForumPost> getPostById(@PathVariable Long id) {
        return forumService.getPostById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

<<<<<<< HEAD
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
=======
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
>>>>>>> b0248089 (fonctions (pas encore integration user))
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
<<<<<<< HEAD
            return ResponseEntity.ok(post); // 200 OK with the created post
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build(); // 500 if something went wrong
=======
            return ResponseEntity.ok(post);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
>>>>>>> b0248089 (fonctions (pas encore integration user))
        }
    }

    // ── PUT /api/posts/{id} ───────────────────────────────────────────
<<<<<<< HEAD
    // Updates an existing post's text content (author, title, content)
    // Uses @RequestBody because this is a JSON request (no file uploads in edit)
    // Example Postman: PUT http://localhost:8082/api/posts/5
    // Body (JSON): { "author": "Alice", "title": "Updated Title", "content": "New content" }
=======
    // Saves a history snapshot then applies the update.
>>>>>>> b0248089 (fonctions (pas encore integration user))
    @PutMapping("/{id}")
    public ResponseEntity<ForumPost> updatePost(@PathVariable Long id, @RequestBody ForumPost post) {
        try {
            return ResponseEntity.ok(forumService.updatePost(id, post));
        } catch (RuntimeException e) {
<<<<<<< HEAD
            return ResponseEntity.notFound().build(); // 404 if post doesn't exist
=======
            return ResponseEntity.notFound().build();
>>>>>>> b0248089 (fonctions (pas encore integration user))
        }
    }

    // ── DELETE /api/posts/{id} ────────────────────────────────────────
<<<<<<< HEAD
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
=======
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
>>>>>>> b0248089 (fonctions (pas encore integration user))
    @PostMapping("/{id}/replies")
    public ResponseEntity<Reply> addReply(@PathVariable Long id, @RequestBody Reply reply) {
        try {
            return ResponseEntity.ok(forumService.addReply(id, reply));
        } catch (RuntimeException e) {
<<<<<<< HEAD
            return ResponseEntity.notFound().build(); // 404 if the parent post doesn't exist
=======
            return ResponseEntity.notFound().build();
>>>>>>> b0248089 (fonctions (pas encore integration user))
        }
    }

    // ── GET /api/posts/{id}/replies ───────────────────────────────────
<<<<<<< HEAD
    // Returns all replies for a specific post
    // Example Postman: GET http://localhost:8082/api/posts/5/replies
=======
>>>>>>> b0248089 (fonctions (pas encore integration user))
    @GetMapping("/{id}/replies")
    public List<Reply> getReplies(@PathVariable Long id) {
        return forumService.getRepliesByPost(id);
    }

    // ── DELETE /api/posts/replies/{replyId} ───────────────────────────
<<<<<<< HEAD
    // Deletes a specific reply by its own ID (used by admin)
    // Note: the URL is /api/posts/replies/{replyId} not /api/posts/{id}/replies/{replyId}
    // Example Postman: DELETE http://localhost:8082/api/posts/replies/12
=======
>>>>>>> b0248089 (fonctions (pas encore integration user))
    @DeleteMapping("/replies/{replyId}")
    public ResponseEntity<Void> deleteReply(@PathVariable Long replyId) {
        forumService.deleteReply(replyId);
        return ResponseEntity.noContent().build();
    }

<<<<<<< HEAD
    // ── POST /api/posts/{id}/react ────────────────────────────────────
    // Adds an emoji reaction to a post (increments the count by 1)
    // @RequestParam reads the emoji from the URL query string: ?emoji=👍
    // Example Postman: POST http://localhost:8082/api/posts/5/react?emoji=👍
=======
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
>>>>>>> b0248089 (fonctions (pas encore integration user))
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