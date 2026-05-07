package com.prolance.message.repository;

import com.prolance.message.domain.MessageReaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MessageReactionRepository extends JpaRepository<MessageReaction, Long> {
    List<MessageReaction> findByMessageId(Long messageId);
    Optional<MessageReaction> findByMessageIdAndUserId(Long messageId, Long userId);
    void deleteByMessageIdAndUserId(Long messageId, Long userId);

    @Modifying
    @Query("DELETE FROM MessageReaction r WHERE r.messageId = :messageId")
    void deleteByMessageId(@Param("messageId") Long messageId);
}
