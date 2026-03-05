package com.prolance.dispute.repository;

import com.prolance.dispute.domain.Dispute;
import com.prolance.dispute.domain.DisputeStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DisputeRepository extends JpaRepository<Dispute, Long> {

    List<Dispute> findByStatus(DisputeStatus status);

    List<Dispute> findByContractId(Long contractId);
}
