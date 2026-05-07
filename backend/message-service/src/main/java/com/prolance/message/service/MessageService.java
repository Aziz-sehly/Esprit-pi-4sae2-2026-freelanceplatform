package com.prolance.message.service;

import com.prolance.message.domain.Message;
import com.prolance.message.domain.MessageStatus;
import com.prolance.message.dto.ConversationDto;
import com.prolance.message.dto.ConversationLastMessageDto;
import com.prolance.message.dto.MessageRequest;
import com.prolance.message.dto.MessageUpdateRequest;
import com.prolance.message.dto.UserDto;
import com.prolance.message.repository.MessageRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class MessageService {

    private static final Logger log = LoggerFactory.getLogger(MessageService.class);

    private final MessageRepository messageRepository;
    private final UserDirectoryService userDirectoryService;
    private final MessageAdvancedService advancedService;
    private final CensorService censorService;
    private final SimpMessagingTemplate messagingTemplate;

    /** Comma-separated list in YAML / env; avoids fragile {@link List} binding on some setups. */
    @Value("${app.demo-user-ids:1,2,3,4,5,6,7,8,9,10}")
    private String demoUserIdsCsv;

    public MessageService(MessageRepository messageRepository, UserDirectoryService userDirectoryService,
                          MessageAdvancedService advancedService, CensorService censorService,
                          SimpMessagingTemplate messagingTemplate) {
        this.messageRepository = messageRepository;
        this.userDirectoryService = userDirectoryService;
        this.advancedService = advancedService;
        this.censorService = censorService;
        this.messagingTemplate = messagingTemplate;
    }

    public List<UserDto> getAllUsers(Long excludeUserId) {
        try {
            return getAllUsersInternal(excludeUserId);
        } catch (Throwable t) {
            log.warn("getAllUsers failed, fallback demo ids: {}", t.getMessage());
            List<UserDto> fallback = new ArrayList<>();
            for (Long id : parseDemoUserIds()) {
                if (id != null && !id.equals(excludeUserId)) {
                    fallback.add(new UserDto(id, null, null, null, null));
                }
            }
            return fallback;
        }
    }

    private List<UserDto> getAllUsersInternal(Long excludeUserId) {
        Map<Long, UserDto> byId = new LinkedHashMap<>();

        try {
            List<UserDto> users = userDirectoryService.getUsers(excludeUserId);
            for (UserDto u : users) {
                Long id = u != null ? u.getId() : null;
                if (id != null && !id.equals(excludeUserId)) {
                    byId.put(id, u);
                }
            }
        } catch (Exception e) {
            // User-service indisponible ou erreur : on continue avec les autres sources
        }

        try {
            for (Long id : messageRepository.findDistinctSenderIds()) {
                if (id != null && !id.equals(excludeUserId) && !byId.containsKey(id)) {
                    byId.put(id, new UserDto(id, null, null, null, null));
                }
            }
            for (Long id : messageRepository.findDistinctReceiverIds()) {
                if (id != null && !id.equals(excludeUserId) && !byId.containsKey(id)) {
                    byId.put(id, new UserDto(id, null, null, null, null));
                }
            }
        } catch (Exception e) {
            // Erreur DB : on continue
        }

        if (byId.isEmpty()) {
            for (Long id : parseDemoUserIds()) {
                if (id != null && !id.equals(excludeUserId)) {
                    byId.put(id, new UserDto(id, null, null, null, null));
                }
            }
        }

        return new ArrayList<>(byId.values());
    }

    private List<Long> parseDemoUserIds() {
        if (demoUserIdsCsv == null || demoUserIdsCsv.isBlank()) {
            return List.of(1L, 2L, 3L, 4L, 5L, 6L, 7L, 8L, 9L, 10L);
        }
        List<Long> ids = new ArrayList<>();
        for (String part : demoUserIdsCsv.split(",")) {
            String t = part.trim();
            if (t.isEmpty()) continue;
            try {
                ids.add(Long.parseLong(t));
            } catch (NumberFormatException ignored) {
                // skip invalid token
            }
        }
        return ids.isEmpty() ? List.of(1L, 2L, 3L, 4L, 5L, 6L, 7L, 8L, 9L, 10L) : ids;
    }

    public Message create(MessageRequest request) {
        if (advancedService.isBlocked(request.getSenderUserId(), request.getReceiverUserId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot send messages to this user. They have blocked you.");
        }
        Message message = new Message();
        message.setContractId(request.getContractId());
        message.setSenderUserId(request.getSenderUserId());
        message.setReceiverUserId(request.getReceiverUserId());
        message.setContent(censorService.censor(request.getContent().trim()));
        message.setStatus(MessageStatus.SENT);
        if (request.getScheduledAt() != null) {
            message.setScheduledAt(request.getScheduledAt());
            message.setSentAt(request.getScheduledAt());
        } else {
            message.setSentAt(LocalDateTime.now());
        }
        if (request.getAttachmentUrl() != null && !request.getAttachmentUrl().isBlank()) {
            message.setAttachmentUrl(request.getAttachmentUrl());
            message.setAttachmentFileName(request.getAttachmentFileName());
        }
        if (request.getParentId() != null) message.setParentId(request.getParentId());
        if (request.getThreadId() != null) message.setThreadId(request.getThreadId());
        if (request.getEphemeralSeconds() != null && request.getEphemeralSeconds() > 0) {
            message.setEphemeralSeconds(request.getEphemeralSeconds());
        } else if (request.getEphemeralMinutes() != null && request.getEphemeralMinutes() > 0) {
            message.setEphemeralMinutes(request.getEphemeralMinutes());
        }
        if (request.getContentType() != null) message.setContentType(request.getContentType());
        Message saved = messageRepository.save(message);
        advancedService.logAudit(saved.getId(), "CREATED", request.getSenderUserId(), null);
        String topic = "/topic/conv/" + saved.getContractId() + "/"
                + Math.min(saved.getSenderUserId(), saved.getReceiverUserId()) + "/"
                + Math.max(saved.getSenderUserId(), saved.getReceiverUserId());
        messagingTemplate.convertAndSend(topic, Map.of("type", "new_message", "message", saved));
        return saved;
    }

    public Message findById(Long id) {
        return messageRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Message not found"));
    }

    public List<Message> list(Long contractId, Long userId) {
        if (contractId != null) {
            return messageRepository.findByContractIdOrderBySentAtAsc(contractId);
        }
        if (userId != null) {
            return messageRepository.findBySenderUserIdOrReceiverUserIdOrderBySentAtAsc(userId, userId);
        }
        return messageRepository.findAll();
    }

    /** Liste admin avec filtres : search (contenu OU nom), status, date, sortOrder */
    public List<Message> listAdmin(Long contractId, Long userId, String content, String status,
                                   LocalDate dateFrom, LocalDate dateTo, String sortOrder, String userName,
                                   String search, LocalDate date) {
        List<Message> list;
        if (contractId != null) {
            list = new ArrayList<>(messageRepository.findByContractIdOrderBySentAtAsc(contractId));
        } else if (userId != null) {
            list = new ArrayList<>(messageRepository.findBySenderUserIdOrReceiverUserIdOrderBySentAtAsc(userId, userId));
        } else {
            list = new ArrayList<>(messageRepository.findAllByOrderBySentAtDesc());
        }

        // Recherche unifiée : contenu OU nom utilisateur
        String searchTerm = (search != null && !search.isBlank()) ? search : null;
        if (searchTerm == null && (content != null && !content.isBlank())) searchTerm = content;
        if (searchTerm == null && (userName != null && !userName.isBlank())) searchTerm = userName;

        Set<Long> userIdsByName = null;
        if (searchTerm != null) {
            userIdsByName = userDirectoryService.searchUserIdsByName(searchTerm);
        }

        final String finalSearch = searchTerm;
        final Set<Long> finalUserIds = userIdsByName;
        LocalDate effectiveDateFrom = date != null ? date : dateFrom;
        LocalDate effectiveDateTo = date != null ? date : dateTo;

        list = list.stream()
                .filter(m -> {
                    if (finalSearch == null) return true;
                    boolean contentMatch = m.getContent() != null && m.getContent().toLowerCase().contains(finalSearch.toLowerCase());
                    boolean userMatch = finalUserIds != null && (finalUserIds.contains(m.getSenderUserId()) || finalUserIds.contains(m.getReceiverUserId()));
                    return contentMatch || userMatch;
                })
                .filter(m -> status == null || status.isBlank() || m.getStatus().name().equalsIgnoreCase(status))
                .filter(m -> effectiveDateFrom == null || !m.getSentAt().toLocalDate().isBefore(effectiveDateFrom))
                .filter(m -> effectiveDateTo == null || !m.getSentAt().toLocalDate().isAfter(effectiveDateTo))
                .collect(Collectors.toList());

        if ("oldest".equalsIgnoreCase(sortOrder)) {
            list.sort(Comparator.comparing(Message::getSentAt));
        } else {
            list.sort((a, b) -> b.getSentAt().compareTo(a.getSentAt()));
        }
        return list;
    }

    /** Mise à jour admin (sans vérification de l'expéditeur) */
    public Message adminUpdateMessage(Long id, MessageUpdateRequest request) {
        Message message = findById(id);
        String oldContent = message.getContent();
        message.setContent(censorService.censor(request.getContent().trim()));
        Message saved = messageRepository.save(message);
        advancedService.logAudit(id, "UPDATED", 0L, "admin edit, previous: " + (oldContent != null ? oldContent.substring(0, Math.min(80, oldContent.length())) : ""));
        return saved;
    }

    public List<Message> listByContract(Long contractId) {
        return messageRepository.findByContractIdOrderBySentAtAsc(contractId);
    }

    public List<Message> listConversation(Long contractId, Long userId, Long otherUserId) {
        List<Message> list = messageRepository.findByContractAndUsers(contractId, userId, otherUserId);
        LocalDateTime now = LocalDateTime.now();
        return list.stream()
                .filter(m -> m.getScheduledAt() == null || !m.getScheduledAt().isAfter(now))
                .collect(Collectors.toList());
    }

    public List<ConversationDto> getConversations(Long userId) {
        try {
            List<Message> allMessages = messageRepository.findBySenderUserIdOrReceiverUserIdOrderBySentAtAsc(userId, userId);
            Map<String, List<Message>> byConversation = new HashMap<>();
            for (Message m : allMessages) {
                if (m == null) continue;
                Long senderId = m.getSenderUserId();
                Long recvId = m.getReceiverUserId();
                if (senderId == null || recvId == null) continue;
                Long other = Objects.equals(senderId, userId) ? recvId : senderId;
                if (other == null) continue;
                String key = m.getContractId() + "|" + Math.min(userId, other) + "|" + Math.max(userId, other);
                byConversation.computeIfAbsent(key, k -> new ArrayList<>()).add(m);
            }
            List<ConversationDto> result = new ArrayList<>();
            for (List<Message> msgs : byConversation.values()) {
                if (msgs == null || msgs.isEmpty()) continue;
                Message last = msgs.get(msgs.size() - 1);
                if (last == null) continue;
                Long ls = last.getSenderUserId();
                Long lr = last.getReceiverUserId();
                if (ls == null || lr == null) continue;
                Long otherUserId = Objects.equals(ls, userId) ? lr : ls;
                long unread = msgs.stream()
                        .filter(m -> m != null && m.getReceiverUserId() != null && m.getReceiverUserId().equals(userId) && m.getStatus() == MessageStatus.SENT)
                        .count();
                result.add(new ConversationDto(last.getContractId(), otherUserId, ConversationLastMessageDto.from(last), unread));
            }
            result.sort((a, b) -> {
                ConversationLastMessageDto la = a != null ? a.getLastMessage() : null;
                ConversationLastMessageDto lb = b != null ? b.getLastMessage() : null;
                if (la == null || la.getSentAt() == null) return 1;
                if (lb == null || lb.getSentAt() == null) return -1;
                return lb.getSentAt().compareTo(la.getSentAt());
            });
            return result;
        } catch (Exception e) {
            log.warn("getConversations failed userId={}: {}", userId, e.getMessage());
            return List.of();
        }
    }

    public Message markAsRead(Long id) {
        Message message = findById(id);
        message.setStatus(MessageStatus.READ);
        Message saved = messageRepository.save(message);
        advancedService.logAudit(id, "READ", message.getReceiverUserId(), null);
        return saved;
    }

    public Message updateMessage(Long id, Long senderUserId, MessageUpdateRequest request) {
        Message message = findById(id);
        if (!message.getSenderUserId().equals(senderUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Seul l'expéditeur peut modifier ce message");
        }
        String oldContent = message.getContent();
        message.setContent(censorService.censor(request.getContent().trim()));
        Message saved = messageRepository.save(message);
        advancedService.logAudit(id, "UPDATED", senderUserId, oldContent != null ? "previous: " + oldContent.substring(0, Math.min(100, oldContent.length())) : null);
        return saved;
    }

    @Transactional
    public void deleteMessage(Long id) {
        Message message = messageRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Message not found"));
        String contentPreview = message.getContent();
        advancedService.logAudit(id, "DELETED", message.getSenderUserId(), contentPreview != null && !contentPreview.isEmpty() ? "content: " + contentPreview.substring(0, Math.min(80, contentPreview.length())) : null);
        messageRepository.deleteById(id);
    }

    @Transactional
    public void deleteConversation(Long contractId, Long userId, Long otherUserId) {
        if (contractId == null || userId == null || otherUserId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "contractId, userId and otherUserId are required");
        }
        if (userId.equals(otherUserId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Conversation participants must be different users");
        }
        messageRepository.deleteByContractAndUsers(contractId, userId, otherUserId);
    }

    public List<Message> getReplies(Long parentId) {
        return messageRepository.findByParentIdOrderBySentAtAsc(parentId);
    }

    public List<Message> getThread(Long threadId) {
        return messageRepository.findByThreadIdOrderBySentAtAsc(threadId);
    }
}
