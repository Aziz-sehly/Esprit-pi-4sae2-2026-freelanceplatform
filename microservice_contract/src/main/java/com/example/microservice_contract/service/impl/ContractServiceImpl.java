package com.example.microservice_contract.service.impl;

import com.example.microservice_contract.dto.ContractDto;
import com.example.microservice_contract.dto.ContractExtensionDto;
import com.example.microservice_contract.dto.ContractSignatureDto;
import com.example.microservice_contract.entity.Contract;
import com.example.microservice_contract.Enum.ContractStatus;
import com.example.microservice_contract.feign.ProposalClient;
import com.example.microservice_contract.feign.UserClient;
import com.example.microservice_contract.repository.IContractRepository;
import com.example.microservice_contract.service.IContractService;
import com.example.microservice_contract.service.IContractSignatureService;
import jakarta.persistence.EntityNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
@Transactional
public class ContractServiceImpl implements IContractService {

    private final IContractRepository      contractRepository;
    private final IContractSignatureService signatureService;
    private final ProposalClient           proposalClient;
    private final UserClient               userClient;

    public ContractServiceImpl(IContractRepository contractRepository,
                               @Lazy IContractSignatureService signatureService,
                               ProposalClient proposalClient,
                               UserClient userClient) {
        this.contractRepository = contractRepository;
        this.signatureService   = signatureService;
        this.proposalClient     = proposalClient;
        this.userClient         = userClient;
    }

    @Override
    public ContractDto.Response createContract(ContractDto.CreateRequest request) {

        // ── Auto-enrich with real emails/names from user microservice ─────────
        // If the caller already provided emails (e.g. from proposal service
        // in testing mode), we keep them. Otherwise we fetch from user service.
        String clientEmail     = request.getClientEmail();
        String clientName      = request.getClientName();
        String freelancerEmail = request.getFreelancerEmail();
        String freelancerName  = request.getFreelancerName();

        if (clientEmail == null || clientEmail.isBlank()) {
            try {
                UserClient.UserData client = userClient.getUserById(request.getClientId());
                clientEmail = client.getEmail();
                clientName  = client.getFullName();
                log.info("Fetched client email from user service: {}", clientEmail);
            } catch (Exception e) {
                log.warn("Could not fetch client from user service: {}", e.getMessage());
                clientEmail = "client" + request.getClientId() + "@prolance.com";
                clientName  = "Client " + request.getClientId();
            }
        }

        if (freelancerEmail == null || freelancerEmail.isBlank()) {
            try {
                UserClient.UserData freelancer = userClient.getUserById(request.getFreelancerId());
                freelancerEmail = freelancer.getEmail();
                freelancerName  = freelancer.getFullName();
                log.info("Fetched freelancer email from user service: {}", freelancerEmail);
            } catch (Exception e) {
                log.warn("Could not fetch freelancer from user service: {}", e.getMessage());
                freelancerEmail = "freelancer" + request.getFreelancerId() + "@prolance.com";
                freelancerName  = "Freelancer " + request.getFreelancerId();
            }
        }

        // ── Build and save contract ───────────────────────────────────────────
        Contract contract = Contract.builder()
                .projectId(request.getProjectId())
                .proposalId(request.getProposalId())
                .freelancerId(request.getFreelancerId())
                .clientId(request.getClientId())
                .amount(request.getAmount())
                .platformFeePercentage(request.getPlatformFeePercentage())
                .paymentStructure(request.getPaymentStructure())
                .status(ContractStatus.PENDING)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .build();

        Contract saved = contractRepository.save(contract);
        log.info("Contract {} saved, initiating signatures", saved.getId());

        // ── Initiate signatures with resolved emails ──────────────────────────
        initiateSignatures(saved, request.getClientId(), clientEmail, clientName,
                request.getFreelancerId(), freelancerEmail, freelancerName);

        return toResponse(saved);
    }

    private void initiateSignatures(Contract contract,
                                    Long clientId,    String clientEmail,    String clientName,
                                    Long freelancerId, String freelancerEmail, String freelancerName) {
        signatureService.initiateSignature(contract.getId(),
                ContractSignatureDto.CreateRequest.builder()
                        .signerId(clientId)
                        .signerRole("CLIENT")
                        .signerEmail(clientEmail)
                        .signerName(clientName)
                        .build());

        signatureService.initiateSignature(contract.getId(),
                ContractSignatureDto.CreateRequest.builder()
                        .signerId(freelancerId)
                        .signerRole("FREELANCER")
                        .signerEmail(freelancerEmail)
                        .signerName(freelancerName)
                        .build());
    }

    // ── Read methods ──────────────────────────────────────────────────────────

    @Override @Transactional(readOnly = true)
    public List<ContractDto.Response> getAllContracts() {
        return contractRepository.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override @Transactional(readOnly = true)
    public ContractDto.Response getContractById(Long id) {
        return toResponse(findOrThrow(id));
    }

    @Override @Transactional(readOnly = true)
    public ContractDto.Response getContractByProposalId(Long proposalId) {
        return toResponse(contractRepository.findByProposalId(proposalId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Contract not found for proposal: " + proposalId)));
    }

    @Override @Transactional(readOnly = true)
    public List<ContractDto.Response> getContractsByClient(Long clientId) {
        return contractRepository.findByClientId(clientId).stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    @Override @Transactional(readOnly = true)
    public List<ContractDto.Response> getContractsByFreelancer(Long freelancerId) {
        return contractRepository.findByFreelancerId(freelancerId).stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    @Override @Transactional(readOnly = true)
    public List<ContractDto.Response> getContractsByStatus(ContractStatus status) {
        return contractRepository.findByStatus(status).stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    @Override @Transactional(readOnly = true)
    public List<ContractDto.Response> getContractsByClientAndStatus(Long clientId, ContractStatus status) {
        return contractRepository.findByClientIdAndStatus(clientId, status).stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    @Override @Transactional(readOnly = true)
    public List<ContractDto.Response> getContractsByFreelancerAndStatus(Long freelancerId, ContractStatus status) {
        return contractRepository.findByFreelancerIdAndStatus(freelancerId, status).stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public ContractDto.Response updateContractStatus(Long id, ContractDto.UpdateStatusRequest request) {
        Contract contract = findOrThrow(id);
        contract.setStatus(request.getStatus());
        return toResponse(contractRepository.save(contract));
    }

    @Override
    public void deleteContract(Long id) {
        findOrThrow(id);
        contractRepository.deleteById(id);
    }

    private Contract findOrThrow(Long id) {
        return contractRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Contract not found: " + id));
    }

    private ContractDto.Response toResponse(Contract c) {
        List<ContractExtensionDto.Response> extensions = c.getExtensions().stream()
                .map(e -> ContractExtensionDto.Response.builder()
                        .id(e.getId()).contractId(c.getId())
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
                        .build())
                .collect(Collectors.toList());

        List<ContractSignatureDto.Response> signatures = c.getSignatures().stream()
                .map(s -> ContractSignatureDto.Response.builder()
                        .id(s.getId()).contractId(c.getId())
                        .signerId(s.getSignerId())
                        .signerRole(s.getSignerRole())
                        .signerEmail(s.getSignerEmail())
                        .signerName(s.getSignerName())
                        .status(s.getStatus())
                        .signatureData(s.getSignatureData())
                        .token(s.getToken())
                        .ipAddress(s.getIpAddress())
                        .signedAt(s.getSignedAt())
                        .expiresAt(s.getExpiresAt())
                        .createdAt(s.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        return ContractDto.Response.builder()
                .id(c.getId()).projectId(c.getProjectId())
                .proposalId(c.getProposalId())
                .freelancerId(c.getFreelancerId())
                .clientId(c.getClientId())
                .amount(c.getAmount())
                .platformFeePercentage(c.getPlatformFeePercentage())
                .paymentStructure(c.getPaymentStructure())
                .status(c.getStatus())
                .startDate(c.getStartDate())
                .endDate(c.getEndDate())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .extensions(extensions)
                .signatures(signatures)
                .build();
    }
}