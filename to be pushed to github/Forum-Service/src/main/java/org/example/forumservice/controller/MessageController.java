package org.example.forumservice.controller;

import org.example.forumservice.client.UserServiceClient;
import org.example.forumservice.entity.Message;
import org.example.forumservice.repository.MessageRepository;
import org.example.forumservice.security.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/messages")
@CrossOrigin(origins = "*")
public class MessageController {

    @Autowired private MessageRepository messageRepository;
    @Autowired private JwtUtils jwtUtils;
    @Autowired private UserServiceClient userServiceClient;

    /**
     * POST /api/messages
     * Body: { "recipientId": 2, "content": "Hello!" }
     * Sender is resolved from the JWT.
     */
    @PostMapping
    public ResponseEntity<?> send(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, Object> body) {
        try {
            Long senderId = extractUserId(authHeader);
            Long recipientId = Long.valueOf(body.get("recipientId").toString());
            String content = body.get("content").toString();

            if (content == null || content.isBlank())
                return ResponseEntity.badRequest().body(Map.of("error", "content is required"));

            Message msg = new Message();
            msg.setSenderId(senderId);
            msg.setSenderName(userServiceClient.getUserFullName(senderId));
            msg.setRecipientId(recipientId);
            msg.setRecipientName(userServiceClient.getUserFullName(recipientId));
            msg.setContent(content);

            return ResponseEntity.ok(messageRepository.save(msg));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * GET /api/messages/conversation/{recipientId}
     * Returns all messages between the logged-in user and recipientId.
     */
    @GetMapping("/conversation/{recipientId}")
    public ResponseEntity<?> getConversation(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long recipientId) {
        try {
            Long myId = extractUserId(authHeader);
            return ResponseEntity.ok(messageRepository.findConversation(myId, recipientId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * GET /api/messages/inbox
     * Returns the latest message per conversation for the logged-in user.
     */
    @GetMapping("/inbox")
    public ResponseEntity<?> getInbox(
            @RequestHeader("Authorization") String authHeader) {
        try {
            Long myId = extractUserId(authHeader);
            return ResponseEntity.ok(messageRepository.findInbox(myId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
        }
    }

    private Long extractUserId(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer "))
            throw new IllegalArgumentException("Missing or invalid Authorization header");
        return jwtUtils.extractUserId(authHeader.substring(7));
    }
}