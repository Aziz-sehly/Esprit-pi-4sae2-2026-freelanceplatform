package com.prolance.message.repository;

import com.prolance.message.domain.Message;
import com.prolance.message.domain.MessageStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {

    List<Message> findByContractIdOrderBySentAtAsc(Long contractId);

    List<Message> findBySenderUserIdOrReceiverUserIdOrderBySentAtAsc(Long senderUserId, Long receiverUserId);

    @Query("SELECT m FROM Message m WHERE m.contractId = :contractId AND " +
           "((m.senderUserId = :userId1 AND m.receiverUserId = :userId2) OR (m.senderUserId = :userId2 AND m.receiverUserId = :userId1)) " +
           "ORDER BY m.sentAt ASC")
    List<Message> findByContractAndUsers(@Param("contractId") Long contractId,
                                         @Param("userId1") Long userId1,
                                         @Param("userId2") Long userId2);

    long countByContractIdAndReceiverUserIdAndStatus(Long contractId, Long receiverUserId, MessageStatus status);

    @Modifying
    @Query("DELETE FROM Message m WHERE m.contractId = :contractId")
    void deleteByContractId(@Param("contractId") Long contractId);

    @Modifying
    @Query("DELETE FROM Message m WHERE m.contractId = :contractId AND " +
           "((m.senderUserId = :userId1 AND m.receiverUserId = :userId2) OR (m.senderUserId = :userId2 AND m.receiverUserId = :userId1))")
    void deleteByContractAndUsers(@Param("contractId") Long contractId,
                                  @Param("userId1") Long userId1,
                                  @Param("userId2") Long userId2);

    @Query("SELECT DISTINCT m.senderUserId FROM Message m")
    List<Long> findDistinctSenderIds();

    @Query("SELECT DISTINCT m.receiverUserId FROM Message m")
    List<Long> findDistinctReceiverIds();

    List<Message> findAllByOrderBySentAtDesc();

    List<Message> findByParentIdOrderBySentAtAsc(Long parentId);
    List<Message> findByThreadIdOrderBySentAtAsc(Long threadId);
    List<Message> findByScheduledAtBeforeAndScheduledAtIsNotNull(LocalDateTime before);

    long countByEphemeralMinutesIsNotNullAndEphemeralMinutesGreaterThan(Integer min);
    long countByEphemeralSecondsIsNotNullAndEphemeralSecondsGreaterThan(Long min);
    long countByScheduledAtIsNotNull();
    long countByParentIdIsNotNull();
    long countByAttachmentUrlIsNotNull();
}
