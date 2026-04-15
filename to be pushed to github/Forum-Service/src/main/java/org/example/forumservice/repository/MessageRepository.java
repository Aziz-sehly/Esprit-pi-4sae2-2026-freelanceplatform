package org.example.forumservice.repository;

import org.example.forumservice.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {

    // All messages between two users, oldest first
    @Query("SELECT m FROM Message m WHERE " +
            "(m.senderId = :a AND m.recipientId = :b) OR " +
            "(m.senderId = :b AND m.recipientId = :a) " +
            "ORDER BY m.sentAt ASC")
    List<Message> findConversation(@Param("a") Long a, @Param("b") Long b);

    // Latest message per conversation partner for the inbox view
    @Query("SELECT m FROM Message m WHERE m.id IN (" +
            "  SELECT MAX(m2.id) FROM Message m2 " +
            "  WHERE m2.senderId = :userId OR m2.recipientId = :userId " +
            "  GROUP BY CASE WHEN m2.senderId = :userId THEN m2.recipientId ELSE m2.senderId END" +
            ") ORDER BY m.sentAt DESC")
    List<Message> findInbox(@Param("userId") Long userId);
}