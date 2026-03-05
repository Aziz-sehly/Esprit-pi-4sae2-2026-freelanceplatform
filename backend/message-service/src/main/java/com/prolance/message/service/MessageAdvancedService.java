package com.prolance.message.service;

import com.prolance.message.domain.*;
import com.prolance.message.dto.ReactionDto;
import com.prolance.message.repository.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.data.domain.PageRequest;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class MessageAdvancedService {

    private static final Logger log = LoggerFactory.getLogger(MessageAdvancedService.class);

    private final MessageRepository messageRepository;
    private final MessageReactionRepository reactionRepository;
    private final UserBlockRepository blockRepository;
    private final MessageAuditRepository auditRepository;
    private final ConversationTagRepository tagRepository;
    private final MessageAttachmentRepository attachmentRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public MessageAdvancedService(MessageRepository messageRepository,
                                  MessageReactionRepository reactionRepository,
                                  UserBlockRepository blockRepository,
                                  MessageAuditRepository auditRepository,
                                  ConversationTagRepository tagRepository,
                                  MessageAttachmentRepository attachmentRepository,
                                  SimpMessagingTemplate messagingTemplate) {
        this.messageRepository = messageRepository;
        this.reactionRepository = reactionRepository;
        this.blockRepository = blockRepository;
        this.auditRepository = auditRepository;
        this.tagRepository = tagRepository;
        this.attachmentRepository = attachmentRepository;
        this.messagingTemplate = messagingTemplate;
    }

    public List<ReactionDto> getReactions(Long messageId) {
        return reactionRepository.findByMessageId(messageId).stream()
                .map(r -> new ReactionDto(r.getId(), r.getMessageId(), r.getUserId(), r.getEmoji(), r.getCreatedAt()))
                .collect(Collectors.toList());
    }

    @Transactional
    public ReactionDto addReaction(Long messageId, Long userId, String emoji) {
        MessageReaction r = reactionRepository.findByMessageIdAndUserId(messageId, userId)
                .orElseGet(() -> {
                    MessageReaction nr = new MessageReaction();
                    nr.setMessageId(messageId);
                    nr.setUserId(userId);
                    nr.setEmoji(emoji);
                    return reactionRepository.save(nr);
                });
        if (!r.getEmoji().equals(emoji)) {
            r.setEmoji(emoji);
            r = reactionRepository.save(r);
        }
        return new ReactionDto(r.getId(), r.getMessageId(), r.getUserId(), r.getEmoji(), r.getCreatedAt());
    }

    @Transactional
    public void removeReaction(Long messageId, Long userId) {
        reactionRepository.deleteByMessageIdAndUserId(messageId, userId);
    }

    public void blockUser(Long blockerUserId, Long blockedUserId) {
        if (blockRepository.existsByBlockerUserIdAndBlockedUserId(blockerUserId, blockedUserId)) return;
        UserBlock b = new UserBlock();
        b.setBlockerUserId(blockerUserId);
        b.setBlockedUserId(blockedUserId);
        blockRepository.save(b);
    }

    @Transactional
    public void unblockUser(Long blockerUserId, Long blockedUserId) {
        blockRepository.findByBlockerUserIdAndBlockedUserId(blockerUserId, blockedUserId)
                .ifPresent(blockRepository::delete);
    }

    public boolean isBlocked(Long userId1, Long userId2) {
        return blockRepository.existsByBlockerUserIdAndBlockedUserId(userId1, userId2)
                || blockRepository.existsByBlockerUserIdAndBlockedUserId(userId2, userId1);
    }

    public List<Long> getBlockedUserIds(Long userId) {
        return blockRepository.findByBlockerUserId(userId).stream()
                .map(UserBlock::getBlockedUserId)
                .collect(Collectors.toList());
    }

    public void logAudit(Long messageId, String action, Long userId, String details) {
        MessageAudit a = new MessageAudit();
        a.setMessageId(messageId);
        a.setAction(action);
        a.setUserId(userId);
        a.setDetails(details);
        auditRepository.save(a);
    }

    public List<MessageAudit> getAuditLog(Long messageId) {
        return auditRepository.findByMessageIdOrderByPerformedAtDesc(messageId);
    }

    public List<MessageAudit> getAuditLogByUser(Long userId, int limit) {
        return auditRepository.findByUserIdOrderByPerformedAtDesc(userId,
                PageRequest.of(0, limit));
    }

    public Map<String, Object> getAdminAnalytics() {
        long total = messageRepository.count();
        long ephemeral = messageRepository.countByEphemeralSecondsIsNotNullAndEphemeralSecondsGreaterThan(0L)
                + messageRepository.countByEphemeralMinutesIsNotNullAndEphemeralMinutesGreaterThan(0);
        long scheduled = messageRepository.countByScheduledAtIsNotNull();
        long replies = messageRepository.countByParentIdIsNotNull();
        long withAttachments = messageRepository.countByAttachmentUrlIsNotNull();
        long blocks = blockRepository.count();
        long reactions = reactionRepository.count();
        return Map.of(
                "totalMessages", total,
                "ephemeralMessages", ephemeral,
                "scheduledMessages", scheduled,
                "replyMessages", replies,
                "messagesWithAttachments", withAttachments,
                "totalBlocks", blocks,
                "totalReactions", reactions
        );
    }

    public List<UserBlock> getAllBlocks() {
        return blockRepository.findAll();
    }

    public List<MessageAudit> getAllAudits(int limit) {
        return auditRepository.findAllByOrderByPerformedAtDesc(PageRequest.of(0, limit));
    }

    public List<ConversationTag> getTags(Long contractId, Long userId, Long otherUserId) {
        return tagRepository.findByContractIdAndUserIdAndOtherUserId(contractId, userId, otherUserId);
    }

    public ConversationTag addTag(Long contractId, Long userId, Long otherUserId, String tagName, String color) {
        ConversationTag t = new ConversationTag();
        t.setContractId(contractId);
        t.setUserId(userId);
        t.setOtherUserId(otherUserId);
        t.setTagName(tagName);
        t.setColor(color != null ? color : "#3b82f6");
        return tagRepository.save(t);
    }

    @Transactional
    public void removeTag(Long tagId) {
        tagRepository.deleteById(tagId);
    }

    public void archiveConversation(Long contractId, Long userId, Long otherUserId, boolean archived) {
        List<Message> msgs = messageRepository.findByContractAndUsers(contractId, userId, otherUserId);
        for (Message m : msgs) {
            m.setIsArchived(archived);
            messageRepository.save(m);
        }
    }

    @Scheduled(fixedRate = 10000) // Every 10 seconds for second precision
    @Transactional
    public void processEphemeralMessages() {
        List<Message> all = messageRepository.findAll();
        LocalDateTime now = LocalDateTime.now();
        for (Message m : all) {
            // Skip messages not yet sent (scheduled for future)
            if (m.getScheduledAt() != null && m.getScheduledAt().isAfter(now)) continue;
            long ttlSeconds = 0;
            if (m.getEphemeralSeconds() != null && m.getEphemeralSeconds() > 0) {
                ttlSeconds = m.getEphemeralSeconds();
            } else if (m.getEphemeralMinutes() != null && m.getEphemeralMinutes() > 0) {
                ttlSeconds = m.getEphemeralMinutes() * 60L;
            }
            if (ttlSeconds <= 0) continue;
            if (m.getSentAt().plusSeconds(ttlSeconds).isBefore(now)) {
                Long id = m.getId();
                Long contractId = m.getContractId();
                Long u1 = m.getSenderUserId();
                Long u2 = m.getReceiverUserId();
                reactionRepository.deleteByMessageId(id);
                messageRepository.delete(m);
                log.info("Ephemeral message deleted: id={}, ttlSeconds={}", id, ttlSeconds);
                String topic = "/topic/conv/" + contractId + "/" + Math.min(u1, u2) + "/" + Math.max(u1, u2);
                messagingTemplate.convertAndSend(topic, Map.of("type", "message_deleted", "messageId", id));
            }
        }
    }

    @Scheduled(fixedRate = 30000) // Every 30 seconds
    @Transactional
    public void processScheduledMessages() {
        List<Message> scheduled = messageRepository.findByScheduledAtBeforeAndScheduledAtIsNotNull(LocalDateTime.now());
        for (Message m : scheduled) {
            m.setScheduledAt(null);
            m.setSentAt(LocalDateTime.now());
            messageRepository.save(m);
            String topic = "/topic/conv/" + m.getContractId() + "/" + Math.min(m.getSenderUserId(), m.getReceiverUserId()) + "/" + Math.max(m.getSenderUserId(), m.getReceiverUserId());
            messagingTemplate.convertAndSend(topic, java.util.Map.of("type", "new_message", "message", m));
        }
    }
}
