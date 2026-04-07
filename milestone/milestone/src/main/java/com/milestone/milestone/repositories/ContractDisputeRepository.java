package com.milestone.milestone.repositories;

import com.milestone.milestone.models.ContractDispute;
import com.milestone.milestone.models.DisputeStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ContractDisputeRepository extends JpaRepository<ContractDispute, Long> {
    List<ContractDispute> findByContractIdOrderByUpdatedAtDesc(Long contractId);
    List<ContractDispute> findByContractIdAndStatusOrderByUpdatedAtDesc(Long contractId, DisputeStatus status);
    boolean existsByContractIdAndStatusIn(Long contractId, List<DisputeStatus> statuses);
}
