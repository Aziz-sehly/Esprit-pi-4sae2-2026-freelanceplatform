package com.example.microservice_contract.service.impl;

import com.example.microservice_contract.dto.ContractExtensionDto;
import com.example.microservice_contract.entity.Contract;
import com.example.microservice_contract.entity.ContractExtension;
import com.example.microservice_contract.Enum.ContractStatus;
import com.example.microservice_contract.Enum.ExtensionStatus;
import com.example.microservice_contract.repository.IContractExtensionRepository;
import com.example.microservice_contract.repository.IContractRepository;
import com.example.microservice_contract.service.IContractExtensionService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ContractExtensionServiceImpl implements IContractExtensionService {

    private final IContractExtensionRepository extensionRepository;
    private final IContractRepository contractRepository;

    @Override
    public ContractExtensionDto.Response requestExtension(Long contractId,
                                                          ContractExtensionDto.CreateRequest request) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new EntityNotFoundException("Contract not found: " + contractId));

        if (contract.getStatus() != ContractStatus.ACTIVE) {
            throw new IllegalStateException("Extensions can only be requested on ACTIVE contracts");
        }
        if (extensionRepository.existsByContractIdAndStatus(contractId, ExtensionStatus.PENDING)) {
            throw new IllegalStateException("A pending extension already exists for this contract");
        }

        ContractExtension extension = ContractExtension.builder()
                .contract(contract)
                .additionalDays(request.getAdditionalDays())
                .extensionType(request.getExtensionType())
                .requestingParty(request.getRequestingParty())
                .requesterNote(request.getRequesterNote())
                .proposedAmount(request.getProposedAmount())
                .requestedAt(LocalDateTime.now())
                .status(ExtensionStatus.PENDING)
                .build();

        return toResponse(extensionRepository.save(extension));
    }

    @Override
    public ContractExtensionDto.Response reviewExtension(Long extensionId,
                                                         ContractExtensionDto.ReviewRequest request) {
        ContractExtension extension = findOrThrow(extensionId);

        if (extension.getStatus() != ExtensionStatus.PENDING) {
            throw new IllegalStateException("Only PENDING extensions can be reviewed");
        }

        extension.setStatus(request.getStatus());
        extension.setResponderNote(request.getResponderNote());
        extension.setSuggestedAmount(request.getSuggestedAmount());
        extension.setRiskAlerts(request.getRiskAlerts());
        extension.setResolvedAt(LocalDateTime.now());

        // If approved, push the end date forward by the requested number of days
        if (request.getStatus() == ExtensionStatus.APPROVED) {
            Contract contract = extension.getContract();
            LocalDateTime currentEnd = contract.getEndDate() != null
                    ? contract.getEndDate()
                    : LocalDateTime.now();
            contract.setEndDate(currentEnd.plusDays(extension.getAdditionalDays()));
            contract.setStatus(ContractStatus.EXTENDED);
            contractRepository.save(contract);
        }

        return toResponse(extensionRepository.save(extension));
    }

    @Override
    @Transactional(readOnly = true)
    public ContractExtensionDto.Response getExtensionById(Long id) {
        return toResponse(findOrThrow(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ContractExtensionDto.Response> getExtensionsByContract(Long contractId) {
        return extensionRepository.findByContractId(contractId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ContractExtensionDto.Response> getPendingExtensionsByContract(Long contractId) {
        return extensionRepository.findByContractIdAndStatus(contractId, ExtensionStatus.PENDING)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    // ── helpers ────────────────────────────────────────────────────────────────

    private ContractExtension findOrThrow(Long id) {
        return extensionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("ContractExtension not found: " + id));
    }

    private ContractExtensionDto.Response toResponse(ContractExtension e) {
        return ContractExtensionDto.Response.builder()
                .id(e.getId())
                .contractId(e.getContract().getId())
                .additionalDays(e.getAdditionalDays())
                .extensionType(e.getExtensionType())
                .requestingParty(e.getRequestingParty())
                .status(e.getStatus())
                .proposedAmount(e.getProposedAmount())
                .suggestedAmount(e.getSuggestedAmount())
                .requesterNote(e.getRequesterNote())
                .responderNote(e.getResponderNote())
                .riskAlerts(e.getRiskAlerts())
                .requestedAt(e.getRequestedAt())
                .resolvedAt(e.getResolvedAt())
                .build();
    }
}