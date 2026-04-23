package com.prolance.message.web;

import com.prolance.message.domain.Message;
import com.prolance.message.dto.ConversationDto;
import com.prolance.message.dto.MessageRequest;
import com.prolance.message.dto.MessageUpdateRequest;
import com.prolance.message.dto.UserDto;
import com.prolance.message.service.MessageAdvancedService;
import com.prolance.message.service.MessageService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/messages")
@Validated
public class MessageController {

    private final MessageService messageService;
    private final MessageAdvancedService advancedService;

    public MessageController(MessageService messageService, MessageAdvancedService advancedService) {
        this.messageService = messageService;
        this.advancedService = advancedService;
    }

    @PostMapping
    public Message create(@Valid @RequestBody MessageRequest request) {
        return messageService.create(request);
    }

    @GetMapping
    public List<Message> list(
            @RequestParam(required = false) Long contractId,
            @RequestParam(required = false) Long userId
    ) {
        return messageService.list(contractId, userId);
    }

    @GetMapping("/admin")
    public List<Message> listAdmin(
            @RequestParam(required = false) Long contractId,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String content,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(required = false) String sortOrder,
            @RequestParam(required = false) String userName,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        return messageService.listAdmin(contractId, userId, content, status, dateFrom, dateTo, sortOrder, userName, search, date);
    }

    @GetMapping("/conversations")
    public List<ConversationDto> getConversations(@RequestParam Long userId) {
        return messageService.getConversations(userId);
    }

    @GetMapping("/users")
    public List<UserDto> getUsers(@RequestParam Long userId) {
        return messageService.getAllUsers(userId);
    }

    /**
     * Block / unblock — same controller as other literal paths to avoid ambiguous mapping
     * across multiple {@code @RequestMapping("/api/messages")} classes.
     */
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

    /**
     * Liste des utilisateurs bloqués. {@code /blocked-ids} évite le préfixe {@code /block/...}
     * (moins ambigu avec certains routeurs / proxies).
     */
    @GetMapping(value = {"/blocked-ids", "/block/list"})
    public List<Long> getBlockedUsers(@RequestParam Long userId) {
        return advancedService.getBlockedUserIds(userId);
    }

    @GetMapping("/contracts/{contractId}")
    public List<Message> listByContract(@PathVariable Long contractId) {
        return messageService.listByContract(contractId);
    }

    @GetMapping("/contracts/{contractId}/conversation")
    public List<Message> listConversation(
            @PathVariable @NotNull @Min(value = 0, message = "contractId doit être >= 0") Long contractId,
            @RequestParam @NotNull @Min(value = 1, message = "userId doit être > 0") Long userId,
            @RequestParam @NotNull @Min(value = 1, message = "otherUserId doit être > 0") Long otherUserId
    ) {
        return messageService.listConversation(contractId, userId, otherUserId);
    }

    /**
     * Must be registered after static paths like {@code /users}, {@code /admin}, {@code /contracts/...}}
     * so that {@code GET /messages/users} is not captured as {@code /{id}} with id "users".
     */
    @GetMapping("/{id}")
    public Message findById(@PathVariable Long id) {
        return messageService.findById(id);
    }

    @PatchMapping("/{id}/read")
    public Message markAsRead(@PathVariable Long id) {
        return messageService.markAsRead(id);
    }

    @PutMapping("/{id}")
    public Message updateMessage(
            @PathVariable Long id,
            @RequestParam Long senderUserId,
            @Valid @RequestBody MessageUpdateRequest request
    ) {
        return messageService.updateMessage(id, senderUserId, request);
    }

    @PutMapping("/admin/{id}")
    public Message adminUpdateMessage(@PathVariable Long id, @Valid @RequestBody MessageUpdateRequest request) {
        return messageService.adminUpdateMessage(id, request);
    }

    @DeleteMapping("/{id}")
    public void deleteMessage(@PathVariable Long id) {
        messageService.deleteMessage(id);
    }

    @DeleteMapping("/conversations/{contractId}")
    public void deleteConversation(@PathVariable Long contractId) {
        messageService.deleteConversation(contractId);
    }
}
