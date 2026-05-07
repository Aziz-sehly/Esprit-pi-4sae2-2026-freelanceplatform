package com.example.microservice_contract.service;

import com.example.microservice_contract.dto.ContractDto;
import com.example.microservice_contract.Enum.ContractStatus;

import java.util.List;

public interface IContractService {

    ContractDto.Response createContract(ContractDto.CreateRequest request);

    ContractDto.Response getContractById(Long id);

    ContractDto.Response getContractByProposalId(Long proposalId);

    List<ContractDto.Response> getContractsByClient(Long clientId);

    List<ContractDto.Response> getContractsByFreelancer(Long freelancerId);

    List<ContractDto.Response> getContractsByStatus(ContractStatus status);

    List<ContractDto.Response> getContractsByClientAndStatus(Long clientId, ContractStatus status);

    List<ContractDto.Response> getContractsByFreelancerAndStatus(Long freelancerId, ContractStatus status);

    ContractDto.Response updateContractStatus(Long id, ContractDto.UpdateStatusRequest request);
    // IContractService
    List<ContractDto.Response> getAllContracts();
    void deleteContract(Long id);
}

