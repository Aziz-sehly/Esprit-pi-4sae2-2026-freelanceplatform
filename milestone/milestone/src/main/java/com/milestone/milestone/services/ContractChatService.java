package com.milestone.milestone.services;

import com.milestone.milestone.dto.ChatMessageRequest;
import com.milestone.milestone.dto.ChatMessageResponse;
import com.milestone.milestone.dto.ChatLinkMessageRequest;
import com.milestone.milestone.dto.TypingEvent;
import com.milestone.milestone.dto.ContractCallRequest;
import com.milestone.milestone.dto.NotificationMessage;
import com.milestone.milestone.exception.NotFoundException;
import com.milestone.milestone.models.ChatAttachmentType;
import com.milestone.milestone.models.Contract;
import com.milestone.milestone.models.ContractMessage;
import com.milestone.milestone.models.MessageSenderRole;
import com.milestone.milestone.repositories.ContractMessageRepository;
import com.milestone.milestone.repositories.ContractRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class ContractChatService {

    private final ContractRepository contractRepository;
    private final ContractMessageRepository messageRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Value("${app.uploads.root:uploads}")
    private String uploadsRoot;

    @Transactional(readOnly = true)
    public List<ChatMessageResponse> history(Long contractId) {
        Contract contract = findContract(contractId);
        ensureChatAllowed(contract);
        return messageRepository.findByContractIdOrderBySentAtAsc(contractId).stream()
                .map(this::toResponse)
                .toList();
    }

    public ChatMessageResponse send(Long contractId, ChatMessageRequest req) {
        Contract contract = findContract(contractId);
        ensureChatAllowed(contract);
        validateSender(contract, req.senderId(), req.senderRole(), req.senderName());
        String content = normalizeContent(req.content());
        if (content == null) {
            throw new IllegalStateException("Message content is required");
        }

        ContractMessage message = ContractMessage.builder()
                .contractId(contractId)
                .senderId(req.senderId())
                .senderRole(req.senderRole())
                .senderName(req.senderName())
                .content(content)
                .build();

        ChatMessageResponse response = toResponse(messageRepository.save(message));
        messagingTemplate.convertAndSend("/topic/contracts/" + contractId + "/chat", response);
        return response;
    }

    public ChatMessageResponse sendLink(Long contractId, ChatLinkMessageRequest req) {
        Contract contract = findContract(contractId);
        ensureChatAllowed(contract);
        validateSender(contract, req.senderId(), req.senderRole(), req.senderName());
        validateUrl(req.url());

        ContractMessage message = ContractMessage.builder()
                .contractId(contractId)
                .senderId(req.senderId())
                .senderRole(req.senderRole())
                .senderName(req.senderName())
                .content(normalizeContent(req.content()))
                .attachmentType(ChatAttachmentType.LINK)
                .attachmentLabel(req.label().trim())
                .attachmentUrl(req.url().trim())
                .build();

        ChatMessageResponse response = toResponse(messageRepository.save(message));
        messagingTemplate.convertAndSend("/topic/contracts/" + contractId + "/chat", response);
        return response;
    }

    public ChatMessageResponse sendFile(Long contractId, Long senderId, MessageSenderRole senderRole, String senderName, String content, String label, MultipartFile file) {
        Contract contract = findContract(contractId);
        ensureChatAllowed(contract);
        validateSender(contract, senderId, senderRole, senderName);
        if (file == null || file.isEmpty()) {
            throw new IllegalStateException("A file is required");
        }

        try {
            Path uploadDir = buildContractChatDirectory(contractId);
            Files.createDirectories(uploadDir);

            String originalName = StringUtils.cleanPath(file.getOriginalFilename() == null ? "attachment" : file.getOriginalFilename());
            String storedName = UUID.randomUUID() + "-" + originalName.replace(" ", "_");
            Path target = uploadDir.resolve(storedName);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

            String messageLabel = StringUtils.hasText(label) ? label.trim() : originalName;
            ContractMessage message = ContractMessage.builder()
                    .contractId(contractId)
                    .senderId(senderId)
                    .senderRole(senderRole)
                    .senderName(senderName)
                    .content(normalizeContent(content))
                    .attachmentType(ChatAttachmentType.FILE)
                    .attachmentLabel(messageLabel)
                    .attachmentFileName(originalName)
                    .attachmentMimeType(file.getContentType())
                    .attachmentFileSize(file.getSize())
                    .attachmentStoragePath(target.toString())
                    .build();

            ChatMessageResponse response = toResponse(messageRepository.save(message));
            messagingTemplate.convertAndSend("/topic/contracts/" + contractId + "/chat", response);
            return response;
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to store chat attachment");
        }
    }

    public void typing(TypingEvent event) {
        Contract contract = findContract(event.contractId());
        ensureChatAllowed(contract);
        validateSender(contract, event.senderId(), event.senderRole(), event.senderName());
        messagingTemplate.convertAndSend("/topic/contracts/" + event.contractId() + "/typing", event);
    }

    public void announceCall(Long contractId, ContractCallRequest req) {
        Contract contract = findContract(contractId);
        ensureChatAllowed(contract);
        validateSender(contract, req.senderId(), req.senderRole(), req.senderName());

        String roomUrl = buildMeetingUrl(contractId);
        ContractMessage message = ContractMessage.builder()
                .contractId(contractId)
                .senderId(req.senderId())
                .senderRole(req.senderRole())
                .senderName(req.senderName())
                .content("Started a live contract call.")
                .attachmentType(ChatAttachmentType.LINK)
                .attachmentLabel("Join video call")
                .attachmentUrl(roomUrl)
                .build();

        ChatMessageResponse chatResponse = toResponse(messageRepository.save(message));
        messagingTemplate.convertAndSend("/topic/contracts/" + contractId + "/chat", chatResponse);

        NotificationMessage notification = new NotificationMessage(
                "CONTRACT_CALL_STARTED",
                contractId,
                null,
                null,
                req.senderName() + " started a contract video call",
                java.time.LocalDateTime.now()
        );
        messagingTemplate.convertAndSend("/topic/notifications", notification);
        messagingTemplate.convertAndSend("/topic/contracts/" + contractId, notification);
    }

    @Transactional(readOnly = true)
    public Resource loadAttachment(Long contractId, Long messageId) {
        ContractMessage message = findMessage(contractId, messageId);
        if (message.getAttachmentType() != ChatAttachmentType.FILE || message.getAttachmentStoragePath() == null) {
            throw new IllegalStateException("Chat message does not contain a file");
        }

        Resource resource = new FileSystemResource(message.getAttachmentStoragePath());
        if (!resource.exists()) {
            throw new NotFoundException("Chat attachment file not found: " + messageId);
        }
        return resource;
    }

    public MediaType resolveAttachmentMediaType(ChatMessageResponse response) {
        if (response.attachmentMimeType() == null || response.attachmentMimeType().isBlank()) {
            return MediaType.APPLICATION_OCTET_STREAM;
        }
        try {
            return MediaType.parseMediaType(response.attachmentMimeType());
        } catch (Exception ex) {
            return MediaType.APPLICATION_OCTET_STREAM;
        }
    }

    @Transactional(readOnly = true)
    public ChatMessageResponse getMessage(Long contractId, Long messageId) {
        return toResponse(findMessage(contractId, messageId));
    }

    private Contract findContract(Long contractId) {
        return contractRepository.findById(contractId)
                .orElseThrow(() -> new NotFoundException("Contract not found: " + contractId));
    }

    private ContractMessage findMessage(Long contractId, Long messageId) {
        ContractMessage message = messageRepository.findById(messageId)
                .orElseThrow(() -> new NotFoundException("Chat message not found: " + messageId));
        if (!message.getContractId().equals(contractId)) {
            throw new NotFoundException("Chat message not found in contract: " + messageId);
        }
        return message;
    }

    private void ensureChatAllowed(Contract contract) {
        if (contract.getStatus() != com.milestone.milestone.models.ContractStatus.ACTIVE) {
            throw new IllegalStateException("Chat is only available for active contracts");
        }
    }

    private void validateSender(Contract contract, Long senderId, MessageSenderRole senderRole, String senderName) {
        boolean valid = switch (senderRole) {
            case CLIENT -> contract.getClientId().equals(senderId) && contract.getClientName().equals(senderName);
            case FREELANCER -> contract.getFreelancerId().equals(senderId) && contract.getFreelancerName().equals(senderName);
        };

        if (!valid) {
            throw new IllegalStateException("Sender does not match contract participants");
        }
    }

    private ChatMessageResponse toResponse(ContractMessage message) {
        return new ChatMessageResponse(
                message.getId(),
                message.getContractId(),
                message.getSenderId(),
                message.getSenderRole(),
                message.getSenderName(),
                message.getContent(),
                message.getSentAt(),
                message.getAttachmentType(),
                message.getAttachmentLabel(),
                message.getAttachmentUrl(),
                message.getAttachmentFileName(),
                message.getAttachmentMimeType(),
                message.getAttachmentFileSize(),
                message.getAttachmentType() == ChatAttachmentType.FILE ? "/milestone/api/contracts/" + message.getContractId() + "/chat/" + message.getId() + "/attachment" : null
        );
    }

    private String normalizeContent(String content) {
        if (!StringUtils.hasText(content)) {
            return null;
        }
        return content.trim();
    }

    private void validateUrl(String url) {
        try {
            URI uri = URI.create(url);
            if (uri.getScheme() == null || (!uri.getScheme().startsWith("http"))) {
                throw new IllegalStateException("Only HTTP/HTTPS URLs are allowed");
            }
        } catch (Exception ex) {
            throw new IllegalStateException("Invalid chat link");
        }
    }

    private Path buildContractChatDirectory(Long contractId) {
        return Paths.get(uploadsRoot, "chat", "contracts", String.valueOf(contractId));
    }

    private String buildMeetingUrl(Long contractId) {
        return "https://meet.jit.si/academic-contract-" + contractId;
    }
}
