package com.prolance.message.repository;

import com.prolance.message.domain.MessageAudit;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MessageAuditRepository extends JpaRepository<MessageAudit, Long> {
    List<MessageAudit> findByMessageIdOrderByPerformedAtDesc(Long messageId);
    List<MessageAudit> findByUserIdOrderByPerformedAtDesc(Long userId, Pageable pageable);
    List<MessageAudit> findAllByOrderByPerformedAtDesc(Pageable pageable);
}
