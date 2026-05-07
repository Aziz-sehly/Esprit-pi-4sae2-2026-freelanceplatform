package com.example.microservice_contract.service;

import com.example.microservice_contract.dto.ContractExtensionDto;

import java.util.List;

public interface IContractExtensionService {

    ContractExtensionDto.Response requestExtension(Long contractId, ContractExtensionDto.CreateRequest request);

    ContractExtensionDto.Response reviewExtension(Long extensionId, ContractExtensionDto.ReviewRequest request);

    ContractExtensionDto.Response getExtensionById(Long id);

    List<ContractExtensionDto.Response> getExtensionsByContract(Long contractId);

    List<ContractExtensionDto.Response> getPendingExtensionsByContract(Long contractId);
}