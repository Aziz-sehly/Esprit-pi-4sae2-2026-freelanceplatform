package com.prolance.dispute.repository;

import com.prolance.dispute.domain.Evidence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface EvidenceRepository extends JpaRepository<Evidence, Long> {

    List<Evidence> findByDisputeIdOrderByCreatedAtDesc(Long disputeId);

    @Query("SELECT e.disputeId, COUNT(e) FROM Evidence e WHERE e.disputeId IN :ids GROUP BY e.disputeId")
    List<Object[]> countByDisputeIds(@Param("ids") Collection<Long> ids);
}

