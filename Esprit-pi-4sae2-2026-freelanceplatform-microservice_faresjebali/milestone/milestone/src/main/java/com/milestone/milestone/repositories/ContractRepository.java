package com.milestone.milestone.repositories;

import com.milestone.milestone.models.Contract;
import com.milestone.milestone.models.ContractStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ContractRepository extends JpaRepository<Contract, Long> {
    List<Contract> findByClientId(Long clientId);
    List<Contract> findByFreelancerId(Long freelancerId);
    List<Contract> findByStatus(ContractStatus status);
    List<Contract> findByClientIdAndStatus(Long clientId, ContractStatus status);
    List<Contract> findByFreelancerIdAndStatus(Long freelancerId, ContractStatus status);
}
