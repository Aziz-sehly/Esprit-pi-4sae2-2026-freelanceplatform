package com.example.microservice_contract.service.impl;

import com.example.microservice_contract.dto.ContractExtensionDto;
import com.example.microservice_contract.entity.Contract;
import com.example.microservice_contract.entity.ContractExtension;
import com.example.microservice_contract.Enum.ContractStatus;
import com.example.microservice_contract.Enum.ExtensionStatus;
import com.example.microservice_contract.Enum.ExtensionType;
import com.example.microservice_contract.Enum.PaymentStructure;
import com.example.microservice_contract.feign.MilestoneClient;
import com.example.microservice_contract.repository.IContractExtensionRepository;
import com.example.microservice_contract.repository.IContractRepository;
import com.example.microservice_contract.service.IContractExtensionService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class ContractExtensionServiceImpl implements IContractExtensionService {

    private final IContractExtensionRepository extensionRepository;
    private final IContractRepository          contractRepository;
    private final MilestoneClient              milestoneClient;

    // Extension types that are allowed to update milestone amounts
    private static final Set<ExtensionType> AMOUNT_ELIGIBLE_TYPES = Set.of(
            ExtensionType.SCOPE_CHANGE,
            ExtensionType.COMPLEXITY_UNDERESTIMATED,
            ExtensionType.MUTUAL_AGREEMENT
    );

    // ── Request ────────────────────────────────────────────────────────────────

    @Override
    public ContractExtensionDto.Response requestExtension(
            Long contractId, ContractExtensionDto.CreateRequest request) {

        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Contract not found: " + contractId));

        if (contract.getStatus() != ContractStatus.ACTIVE
                && contract.getStatus() != ContractStatus.EXTENDED)
            throw new IllegalStateException(
                    "Extensions can only be requested on ACTIVE or EXTENDED contracts");

        if (extensionRepository.existsByContractIdAndStatus(contractId, ExtensionStatus.PENDING))
            throw new IllegalStateException(
                    "A pending extension already exists for this contract");

        // Guard: amount must not be set for non-eligible extension types
        if (request.getProposedAmount() != null
                && !AMOUNT_ELIGIBLE_TYPES.contains(request.getExtensionType())) {
            throw new IllegalStateException(
                    "Extension type " + request.getExtensionType()
                            + " does not allow an amount change. "
                            + "Only SCOPE_CHANGE, COMPLEXITY_UNDERESTIMATED, "
                            + "and MUTUAL_AGREEMENT can modify amounts.");
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

    // ── Review (approve / reject) ──────────────────────────────────────────────

    @Override
    public ContractExtensionDto.Response reviewExtension(
            Long extensionId, ContractExtensionDto.ReviewRequest request) {

        ContractExtension extension = findOrThrow(extensionId);

        if (extension.getStatus() != ExtensionStatus.PENDING)
            throw new IllegalStateException("Only PENDING extensions can be reviewed");

        extension.setStatus(request.getStatus());
        extension.setResponderNote(request.getResponderNote());
        extension.setSuggestedAmount(request.getSuggestedAmount());
        extension.setRiskAlerts(request.getRiskAlerts());
        extension.setResolvedAt(LocalDateTime.now());

        if (request.getStatus() == ExtensionStatus.APPROVED) {
            applyApprovedExtension(extension, request);
        }

        return toResponse(extensionRepository.save(extension));
    }

    // ── Core approval logic ────────────────────────────────────────────────────

    private void applyApprovedExtension(ContractExtension extension,
                                        ContractExtensionDto.ReviewRequest request) {

        Contract contract = extension.getContract();
        ExtensionType type = extension.getExtensionType();

        // ── 1. Push contract end date ──────────────────────────────────────────
        LocalDateTime currentEnd = contract.getEndDate() != null
                ? contract.getEndDate() : LocalDateTime.now();
        LocalDateTime newEnd = currentEnd.plusDays(extension.getAdditionalDays());

        contract.setEndDate(newEnd);
        contract.setStatus(ContractStatus.EXTENDED);
        contractRepository.save(contract);

        log.info("Contract {} extended to {} (+{} days) — type: {}",
                contract.getId(), newEnd, extension.getAdditionalDays(), type);

        // ── 2. Decide whether amount should change ─────────────────────────────
        // Amount is only updated for eligible types AND only if one was provided.
        // Priority: reviewer's suggestedAmount > requester's proposedAmount > null
        BigDecimal newTotalAmount = null;
        if (AMOUNT_ELIGIBLE_TYPES.contains(type)) {
            if (request.getSuggestedAmount() != null) {
                newTotalAmount = request.getSuggestedAmount();
            } else if (extension.getProposedAmount() != null) {
                newTotalAmount = extension.getProposedAmount();
            }
        } else {
            // For FREELANCER_DELAY, CLIENT_DELAY, FORCE_MAJEURE —
            // log a warning if the reviewer tried to set an amount anyway
            if (request.getSuggestedAmount() != null) {
                log.warn("Extension type {} does not allow amount changes — " +
                                "ignoring suggestedAmount {} on extension {}",
                        type, request.getSuggestedAmount(), extension.getId());
            }
        }

        // Also update the contract's own amount field if it changed
        if (newTotalAmount != null) {
            contract.setAmount(newTotalAmount);
            contractRepository.save(contract);
            log.info("Contract {} total amount updated to {}", contract.getId(), newTotalAmount);
        }

        // ── 3. Sync milestones (MILESTONE payment structure only) ──────────────
        if (contract.getPaymentStructure() == PaymentStructure.MILESTONE) {
            syncMilestones(contract, extension.getAdditionalDays(), newTotalAmount, newEnd);
        }
    }

    // ── Milestone recalculation ────────────────────────────────────────────────

    private void syncMilestones(Contract contract, int additionalDays,
                                BigDecimal newTotalAmount, LocalDateTime newContractEnd) {
        try {
            List<MilestoneClient.MilestoneFullResponse> all =
                    milestoneClient.getMilestonesByContract(contract.getId());

            if (all == null || all.isEmpty()) {
                log.warn("No milestones found for contract {} — nothing to sync",
                        contract.getId());
                return;
            }

            // Only touch milestones that are not yet completed
            List<MilestoneClient.MilestoneFullResponse> active = all.stream()
                    .filter(m -> !isPaidOrCancelled(m.status()))
                    .collect(Collectors.toList());

            if (active.isEmpty()) {
                log.info("All milestones for contract {} are already PAID/CANCELLED — " +
                        "no recalculation needed", contract.getId());
                return;
            }

            // Split the new total equally across active milestones
            // null = no amount change for this extension type
            BigDecimal perMilestone = null;
            if (newTotalAmount != null) {
                perMilestone = newTotalAmount
                        .divide(BigDecimal.valueOf(active.size()), 2, RoundingMode.HALF_UP);
            }

            for (MilestoneClient.MilestoneFullResponse m : active) {
                // Push due date by the same number of additional days
                LocalDate newDue = m.dueDate() != null
                        ? m.dueDate().plusDays(additionalDays)
                        : newContractEnd.toLocalDate();

                milestoneClient.extendMilestone(
                        m.id(),
                        new MilestoneClient.MilestoneExtendRequest(newDue, perMilestone)
                );

                log.info("Milestone {} recalculated — new due: {}, new amount: {}",
                        m.id(), newDue, perMilestone != null ? perMilestone : "unchanged");
            }

        } catch (Exception e) {
            // Milestone sync is best-effort — contract is already extended at this point.
            // Ops team should reconcile via POST /milestone/api/internal/milestones/{id}/extend
            log.error("Milestone sync failed for contract {} — reconcile manually. Error: {}",
                    contract.getId(), e.getMessage());
        }
    }

    private boolean isPaidOrCancelled(String status) {
        return "PAID".equals(status) || "CANCELLED".equals(status);
    }

    // ── Read ───────────────────────────────────────────────────────────────────

    @Override @Transactional(readOnly = true)
    public ContractExtensionDto.Response getExtensionById(Long id) {
        return toResponse(findOrThrow(id));
    }

    @Override @Transactional(readOnly = true)
    public List<ContractExtensionDto.Response> getExtensionsByContract(Long contractId) {
        return extensionRepository.findByContractId(contractId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override @Transactional(readOnly = true)
    public List<ContractExtensionDto.Response> getPendingExtensionsByContract(Long contractId) {
        return extensionRepository.findByContractIdAndStatus(contractId, ExtensionStatus.PENDING)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private ContractExtension findOrThrow(Long id) {
        return extensionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "ContractExtension not found: " + id));
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