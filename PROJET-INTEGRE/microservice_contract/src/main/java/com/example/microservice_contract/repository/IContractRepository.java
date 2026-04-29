package com.example.microservice_contract.repository;

import com.example.microservice_contract.entity.Contract;
import com.example.microservice_contract.Enum.ContractStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface IContractRepository extends JpaRepository<Contract, Long> {

    List<Contract> findByClientId(Long clientId);

    List<Contract> findByFreelancerId(Long freelancerId);

    List<Contract> findByStatus(ContractStatus status);

    List<Contract> findByClientIdAndStatus(Long clientId, ContractStatus status);

    List<Contract> findByFreelancerIdAndStatus(Long freelancerId, ContractStatus status);

    Optional<Contract> findByProposalId(Long proposalId);

    Optional<Contract> findByProjectIdAndStatus(Long projectId, ContractStatus status);

    boolean existsByProjectIdAndStatusNot(Long projectId, ContractStatus status);

    List<Contract> findByMilestoneId(Long milestoneId);

    List<Contract> findByDisputeId(Long disputeId);
}