package com.prolance.dispute.repository;

import com.prolance.dispute.domain.DisputeAuditEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DisputeAuditEventRepository extends JpaRepository<DisputeAuditEvent, Long> {

    List<DisputeAuditEvent> findByDisputeIdOrderByCreatedAtDesc(Long disputeId);
}

