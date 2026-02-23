package org.example.forumservice.controller;

import org.example.forumservice.entity.ForumPost;
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

    // GET all posts
    @GetMapping
    public List<ForumPost> getAllPosts() {
        return forumService.getAllPosts();
    }

    // GET single post
    @GetMapping("/{id}")
    public ResponseEntity<ForumPost> getPostById(@PathVariable Long id) {
        return forumService.getPostById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // POST create post (with optional image)
    @PostMapping(consumes = {"multipart/form-data"})
    public ResponseEntity<ForumPost> createPost(
            @RequestParam String author,
            @RequestParam String title,
            @RequestParam String content,
            @RequestParam(required = false) MultipartFile image) {
        try {
            ForumPost post = forumService.createPostWithImage(author, title, content, image);
            return ResponseEntity.ok(post);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // PUT update post
    @PutMapping("/{id}")
    public ResponseEntity<ForumPost> updatePost(@PathVariable Long id, @RequestBody ForumPost post) {
        try {
            return ResponseEntity.ok(forumService.updatePost(id, post));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // DELETE post (admin)
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePost(@PathVariable Long id) {
        forumService.deletePost(id);
        return ResponseEntity.noContent().build();
    }

    // POST add reply to a post
    @PostMapping("/{id}/replies")
    public ResponseEntity<Reply> addReply(@PathVariable Long id, @RequestBody Reply reply) {
        try {
            return ResponseEntity.ok(forumService.addReply(id, reply));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // GET replies for a post
    @GetMapping("/{id}/replies")
    public List<Reply> getReplies(@PathVariable Long id) {
        return forumService.getRepliesByPost(id);
    }

    // DELETE reply (admin)
    @DeleteMapping("/replies/{replyId}")
    public ResponseEntity<Void> deleteReply(@PathVariable Long replyId) {
        forumService.deleteReply(replyId);
        return ResponseEntity.noContent().build();
    }

    // POST add emoji reaction
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