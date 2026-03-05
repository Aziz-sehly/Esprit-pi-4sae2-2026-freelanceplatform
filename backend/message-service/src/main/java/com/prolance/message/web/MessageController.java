package com.prolance.message.web;

import com.prolance.message.domain.Message;
import com.prolance.message.dto.ConversationDto;
import com.prolance.message.dto.MessageRequest;
import com.prolance.message.dto.MessageUpdateRequest;
import com.prolance.message.dto.UserDto;
import com.prolance.message.service.MessageService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/messages")
@Validated
public class MessageController {

    private final MessageService messageService;

    public MessageController(MessageService messageService) {
        this.messageService = messageService;
    }

    @PostMapping
    public Message create(@Valid @RequestBody MessageRequest request) {
        return messageService.create(request);
    }

    @GetMapping("/{id}")
    public Message findById(@PathVariable Long id) {
        return messageService.findById(id);
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
