package com.prolance.message.web;

import com.prolance.message.domain.ConversationTag;
import com.prolance.message.domain.Message;
import com.prolance.message.domain.MessageAudit;
import com.prolance.message.dto.ReactionDto;
import com.prolance.message.service.MessageAdvancedService;
import com.prolance.message.service.MessageService;
import org.springframework.web.bind.annotation.*;

import com.prolance.message.domain.UserBlock;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/messages")
public class MessageAdvancedController {

    private final MessageAdvancedService advancedService;
    private final MessageService messageService;

    public MessageAdvancedController(MessageAdvancedService advancedService, MessageService messageService) {
        this.advancedService = advancedService;
        this.messageService = messageService;
    }

    @GetMapping("/{id}/reactions")
    public List<ReactionDto> getReactions(@PathVariable Long id) {
        return advancedService.getReactions(id);
    }

    @PostMapping("/{id}/reactions")
    public ReactionDto addReaction(@PathVariable Long id, @RequestParam Long userId, @RequestParam String emoji) {
        return advancedService.addReaction(id, userId, emoji);
    }

    @DeleteMapping("/{id}/reactions")
    public void removeReaction(@PathVariable Long id, @RequestParam Long userId) {
        advancedService.removeReaction(id, userId);
    }

    @GetMapping("/{id}/replies")
    public List<Message> getReplies(@PathVariable Long id) {
        return messageService.getReplies(id);
    }

    @GetMapping("/{id}/thread")
    public List<Message> getThread(@PathVariable Long id) {
        return messageService.getThread(id);
    }

    @PostMapping("/block")
    public void blockUser(@RequestParam Long blockerUserId, @RequestParam Long blockedUserId) {
        advancedService.blockUser(blockerUserId, blockedUserId);
    }

    @DeleteMapping("/block")
    public void unblockUser(@RequestParam Long blockerUserId, @RequestParam Long blockedUserId) {
        advancedService.unblockUser(blockerUserId, blockedUserId);
    }

    @GetMapping("/block/check")
    public Map<String, Boolean> isBlocked(@RequestParam Long userId1, @RequestParam Long userId2) {
        return Map.of("blocked", advancedService.isBlocked(userId1, userId2));
    }

    @GetMapping("/block/list")
    public List<Long> getBlockedUsers(@RequestParam Long userId) {
        return advancedService.getBlockedUserIds(userId);
    }

    @GetMapping("/{id}/audit")
    public List<MessageAudit> getAuditLog(@PathVariable Long id) {
        return advancedService.getAuditLog(id);
    }

    @GetMapping("/audit/user")
    public List<MessageAudit> getAuditLogByUser(@RequestParam Long userId, @RequestParam(defaultValue = "50") int limit) {
        return advancedService.getAuditLogByUser(userId, limit);
    }

    @GetMapping("/tags")
    public List<ConversationTag> getTags(@RequestParam Long contractId, @RequestParam Long userId, @RequestParam Long otherUserId) {
        return advancedService.getTags(contractId, userId, otherUserId);
    }

    @PostMapping("/tags")
    public ConversationTag addTag(@RequestParam Long contractId, @RequestParam Long userId, @RequestParam Long otherUserId,
                                  @RequestParam String tagName, @RequestParam(required = false) String color) {
        return advancedService.addTag(contractId, userId, otherUserId, tagName, color);
    }

    @DeleteMapping("/tags/{tagId}")
    public void removeTag(@PathVariable Long tagId) {
        advancedService.removeTag(tagId);
    }

    @PostMapping("/archive")
    public void archiveConversation(@RequestParam Long contractId, @RequestParam Long userId, @RequestParam Long otherUserId,
                                    @RequestParam boolean archived) {
        advancedService.archiveConversation(contractId, userId, otherUserId, archived);
    }

    @GetMapping("/admin/analytics")
    public Map<String, Object> getAdminAnalytics() {
        return advancedService.getAdminAnalytics();
    }

    @GetMapping("/admin/blocks")
    public List<UserBlock> getAllBlocks() {
        return advancedService.getAllBlocks();
    }

    @GetMapping("/admin/audit")
    public List<MessageAudit> getAllAudits(@RequestParam(defaultValue = "100") int limit) {
        return advancedService.getAllAudits(limit);
    }
}
