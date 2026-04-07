package com.milestone.milestone.controllers;

import com.milestone.milestone.dto.ChatMessageRequest;
import com.milestone.milestone.dto.ChatMessageResponse;
import com.milestone.milestone.dto.ChatLinkMessageRequest;
import com.milestone.milestone.models.MessageSenderRole;
import com.milestone.milestone.dto.ContractCallRequest;
import com.milestone.milestone.services.ContractChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/contracts/{contractId}/chat")
@RequiredArgsConstructor
public class ContractChatController {

    private final ContractChatService service;

    @GetMapping
    public List<ChatMessageResponse> history(@PathVariable Long contractId) {
        return service.history(contractId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ChatMessageResponse send(@PathVariable Long contractId, @RequestBody @Valid ChatMessageRequest req) {
        return service.send(contractId, req);
    }

    @PostMapping("/links")
    @ResponseStatus(HttpStatus.CREATED)
    public ChatMessageResponse sendLink(@PathVariable Long contractId, @RequestBody @Valid ChatLinkMessageRequest req) {
        return service.sendLink(contractId, req);
    }

    @PostMapping(value = "/files", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public ChatMessageResponse sendFile(
            @PathVariable Long contractId,
            @RequestParam Long senderId,
            @RequestParam MessageSenderRole senderRole,
            @RequestParam String senderName,
            @RequestParam(required = false) String content,
            @RequestParam(required = false) String label,
            @RequestPart("file") MultipartFile file
    ) {
        return service.sendFile(contractId, senderId, senderRole, senderName, content, label, file);
    }

    @GetMapping("/{messageId}/attachment")
    public ResponseEntity<Resource> downloadAttachment(@PathVariable Long contractId, @PathVariable Long messageId) {
        ChatMessageResponse response = service.getMessage(contractId, messageId);
        Resource file = service.loadAttachment(contractId, messageId);

        return ResponseEntity.ok()
                .contentType(service.resolveAttachmentMediaType(response))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + (response.attachmentFileName() == null ? "attachment" : response.attachmentFileName()) + "\"")
                .body(file);
    }

    @PostMapping("/call")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public void announceCall(@PathVariable Long contractId, @RequestBody @Valid ContractCallRequest req) {
        service.announceCall(contractId, req);
    }
}
