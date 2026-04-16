package com.prolance.dispute.repository;

import com.prolance.dispute.domain.DisputeAuditEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface DisputeAuditEventRepository extends JpaRepository<DisputeAuditEvent, Long> {

    List<DisputeAuditEvent> findByDisputeIdOrderByCreatedAtDesc(Long disputeId);

    @Query("SELECT a.disputeId, COUNT(a) FROM DisputeAuditEvent a WHERE a.disputeId IN :ids "
            + "AND a.eventType IN ('DISPUTE_UPDATED', 'DISPUTE_UPDATED_ADMIN') GROUP BY a.disputeId")
    List<Object[]> countUpdateEventsByDisputeIds(@Param("ids") Collection<Long> ids);
}

