package com.example.microservice_contract.repository;

import com.example.microservice_contract.entity.ContractExtension;
import com.example.microservice_contract.Enum.ExtensionStatus;
import com.example.microservice_contract.Enum.RequestingParty;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IContractExtensionRepository extends JpaRepository<ContractExtension, Long> {

    List<ContractExtension> findByContractId(Long contractId);

    List<ContractExtension> findByContractIdAndStatus(Long contractId, ExtensionStatus status);

    List<ContractExtension> findByContractIdAndRequestingParty(Long contractId, RequestingParty requestingParty);

    boolean existsByContractIdAndStatus(Long contractId, ExtensionStatus status);
}