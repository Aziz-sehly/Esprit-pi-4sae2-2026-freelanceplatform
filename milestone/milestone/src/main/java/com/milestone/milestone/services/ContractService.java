package com.milestone.milestone.services;

import com.milestone.milestone.dto.ContractRequest;
import com.milestone.milestone.dto.ContractResponse;
import com.milestone.milestone.exception.NotFoundException;
import com.milestone.milestone.models.Contract;
import com.milestone.milestone.models.ContractStatus;
import com.milestone.milestone.repositories.ContractRepository;
import com.milestone.milestone.repositories.MilestoneRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ContractService {

    private final ContractRepository repo;
    private final MilestoneRepository milestoneRepository;

    public ContractResponse create(ContractRequest req) {
        Contract contract = Contract.builder()
                .clientId(req.clientId())
                .freelancerId(req.freelancerId())
                .title(req.title())
                .scope(req.scope())
                .totalBudget(req.totalBudget())
                .clientName(req.clientName())
                .freelancerName(req.freelancerName())
                .startDate(req.startDate())
                .endDate(req.endDate())
                .status(ContractStatus.PENDING_ACCEPTANCE)
                .build();
        return toResponse(repo.save(contract));
    }

    @Transactional(readOnly = true)
    public ContractResponse getById(Long id) {
        return toResponse(findContract(id));
    }

    @Transactional(readOnly = true)
    public List<ContractResponse> list(Long clientId, Long freelancerId, ContractStatus status) {
        if (clientId != null && status != null) {
            return repo.findByClientIdAndStatus(clientId, status).stream().map(this::toResponse).toList();
        }
        if (freelancerId != null && status != null) {
            return repo.findByFreelancerIdAndStatus(freelancerId, status).stream().map(this::toResponse).toList();
        }
        if (clientId != null) {
            return repo.findByClientId(clientId).stream().map(this::toResponse).toList();
        }
        if (freelancerId != null) {
            return repo.findByFreelancerId(freelancerId).stream().map(this::toResponse).toList();
        }
        if (status != null) {
            return repo.findByStatus(status).stream().map(this::toResponse).toList();
        }
        return repo.findAll().stream().map(this::toResponse).toList();
    }

    public ContractResponse update(Long id, ContractRequest req) {
        Contract contract = findContract(id);
        if (contract.getStatus() == ContractStatus.ACTIVE || contract.getStatus() == ContractStatus.COMPLETED) {
            throw new IllegalStateException("Only pending or draft contracts can be updated");
        }

        contract.setClientId(req.clientId());
        contract.setFreelancerId(req.freelancerId());
        contract.setTitle(req.title());
        contract.setScope(req.scope());
        contract.setTotalBudget(req.totalBudget());
        contract.setClientName(req.clientName());
        contract.setFreelancerName(req.freelancerName());
        contract.setStartDate(req.startDate());
        contract.setEndDate(req.endDate());

        return toResponse(repo.save(contract));
    }

    public ContractResponse accept(Long id) {
        Contract contract = findContract(id);
        requirePendingAcceptance(contract);
        contract.setStatus(ContractStatus.ACTIVE);
        contract.setRespondedAt(LocalDateTime.now());
        return toResponse(repo.save(contract));
    }

    public ContractResponse reject(Long id) {
        Contract contract = findContract(id);
        requirePendingAcceptance(contract);
        contract.setStatus(ContractStatus.REJECTED);
        contract.setRespondedAt(LocalDateTime.now());
        return toResponse(repo.save(contract));
    }

    public ContractResponse complete(Long id) {
        Contract contract = findContract(id);
        if (contract.getStatus() != ContractStatus.ACTIVE) {
            throw new IllegalStateException("Only active contracts can be completed");
        }
        contract.setStatus(ContractStatus.COMPLETED);
        return toResponse(repo.save(contract));
    }

    public void delete(Long id) {
        Contract contract = findContract(id);
        if (contract.getStatus() == ContractStatus.ACTIVE && !milestoneRepository.findByContractId(id).isEmpty()) {
            throw new IllegalStateException("Active contracts with milestones cannot be deleted");
        }
        repo.delete(contract);
    }

    private Contract findContract(Long id) {
        return repo.findById(id)
                .orElseThrow(() -> new NotFoundException("Contract not found: " + id));
    }

    private void requirePendingAcceptance(Contract contract) {
        if (contract.getStatus() != ContractStatus.PENDING_ACCEPTANCE) {
            throw new IllegalStateException("Contract must be pending acceptance");
        }
    }

    private ContractResponse toResponse(Contract contract) {
        return new ContractResponse(
                contract.getId(),
                contract.getClientId(),
                contract.getFreelancerId(),
                contract.getTitle(),
                contract.getScope(),
                contract.getTotalBudget(),
                contract.getClientName(),
                contract.getFreelancerName(),
                contract.getStartDate(),
                contract.getEndDate(),
                contract.getRespondedAt(),
                contract.getStatus(),
                contract.getCreatedAt(),
                contract.getUpdatedAt()
        );
    }
}
