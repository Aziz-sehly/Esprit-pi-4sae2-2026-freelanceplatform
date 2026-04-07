package com.milestone.milestone.repositories;

import com.milestone.milestone.models.ContractMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ContractMessageRepository extends JpaRepository<ContractMessage, Long> {
    List<ContractMessage> findByContractIdOrderBySentAtAsc(Long contractId);
}
