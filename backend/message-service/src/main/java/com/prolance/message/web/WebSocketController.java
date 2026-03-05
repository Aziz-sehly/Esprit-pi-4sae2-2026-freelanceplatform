package com.prolance.message.web;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.Map;

@Controller
public class WebSocketController {

    private final SimpMessagingTemplate messagingTemplate;

    public WebSocketController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    /** Typing indicator: /app/typing -> /topic/conv/{contractId}/{userId1}/{userId2} */
    @MessageMapping("/typing")
    public void typing(Map<String, Object> payload) {
        Long contractId = ((Number) payload.get("contractId")).longValue();
        Long userId = ((Number) payload.get("userId")).longValue();
        Long otherUserId = ((Number) payload.get("otherUserId")).longValue();
        String topic = "/topic/conv/" + contractId + "/" + Math.min(userId, otherUserId) + "/" + Math.max(userId, otherUserId);
        messagingTemplate.convertAndSend(topic, Map.of("type", "typing", "userId", userId));
    }

    /** Presence: user online/offline */
    @MessageMapping("/presence")
    public void presence(Map<String, Object> payload) {
        Long userId = ((Number) payload.get("userId")).longValue();
        String status = (String) payload.getOrDefault("status", "online");
        messagingTemplate.convertAndSend("/topic/presence/" + userId, Map.of("userId", userId, "status", status));
    }

    /** New message broadcast (called after message creation) */
    public void broadcastNewMessage(Long contractId, Long userId1, Long userId2, Object message) {
        String topic = "/topic/conv/" + contractId + "/" + Math.min(userId1, userId2) + "/" + Math.max(userId1, userId2);
        messagingTemplate.convertAndSend(topic, Map.of("type", "new_message", "message", message));
    }
}
