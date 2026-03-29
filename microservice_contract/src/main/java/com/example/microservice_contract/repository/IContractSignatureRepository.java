package com.example.microservice_contract.repository;

import com.example.microservice_contract.entity.ContractSignature;
import com.example.microservice_contract.Enum.SignatureStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface IContractSignatureRepository extends JpaRepository<ContractSignature, Long> {

    List<ContractSignature> findByContractId(Long contractId);

    Optional<ContractSignature> findByContractIdAndSignerId(Long contractId, Long signerId);

    List<ContractSignature> findByContractIdAndStatus(Long contractId, SignatureStatus status);

    // Used when the signer clicks the link from their email
    Optional<ContractSignature> findByToken(String token);

    boolean existsByContractIdAndSignerIdAndStatus(Long contractId, Long signerId, SignatureStatus status);

    long countByContractIdAndStatus(Long contractId, SignatureStatus status);
}