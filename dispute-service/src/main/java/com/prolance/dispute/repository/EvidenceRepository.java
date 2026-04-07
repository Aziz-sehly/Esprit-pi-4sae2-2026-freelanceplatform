package com.prolance.dispute.repository;

import com.prolance.dispute.domain.Evidence;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EvidenceRepository extends JpaRepository<Evidence, Long> {

    List<Evidence> findByDisputeIdOrderByCreatedAtDesc(Long disputeId);
}

