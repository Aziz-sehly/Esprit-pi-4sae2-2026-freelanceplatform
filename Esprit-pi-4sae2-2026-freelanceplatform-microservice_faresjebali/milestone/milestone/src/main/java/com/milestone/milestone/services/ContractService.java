package com.milestone.milestone.services;

import com.milestone.milestone.client.UserClient;
import com.milestone.milestone.dto.ContractRequest;
import com.milestone.milestone.dto.ContractResponse;
import com.milestone.milestone.dto.UserSummary;
import com.milestone.milestone.exception.NotFoundException;
import com.milestone.milestone.models.Contract;
import com.milestone.milestone.models.ContractStatus;
import com.milestone.milestone.repositories.ContractRepository;
import com.milestone.milestone.repositories.MilestoneRepository;
import com.milestone.milestone.security.CurrentUser;
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
    private final UserClient userClient;

    public ContractResponse create(ContractRequest req, CurrentUser actor) {
        requireClient(actor);
        UserSummary client = requireActiveVerifiedUser(userClient.getUserById(actor.id()), "Client");
        UserSummary freelancer = requireActiveVerifiedUser(userClient.getUserById(req.freelancerId()), "Freelancer");
        Contract contract = Contract.builder()
                .clientId(actor.id())
                .freelancerId(req.freelancerId())
                .title(req.title())
                .scope(req.scope())
                .totalBudget(req.totalBudget())
                .clientName(displayName(client))
                .freelancerName(displayName(freelancer))
                .startDate(req.startDate())
                .endDate(req.endDate())
                .status(ContractStatus.PENDING_ACCEPTANCE)
                .build();
        return toResponse(repo.save(contract));
    }

    @Transactional(readOnly = true)
    public ContractResponse getById(Long id, CurrentUser actor) {
        Contract contract = findContract(id);
        requireParticipant(contract, actor);
        return toResponse(contract);
    }

    @Transactional(readOnly = true)
    public List<ContractResponse> list(Long clientId, Long freelancerId, ContractStatus status, CurrentUser actor) {
        if (actor.isAdmin()) {
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

        if (actor.isClient()) {
            if (status != null) {
                return repo.findByClientIdAndStatus(actor.id(), status).stream().map(this::toResponse).toList();
            }
            return repo.findByClientId(actor.id()).stream().map(this::toResponse).toList();
        }

        if (status != null) {
            return repo.findByFreelancerIdAndStatus(actor.id(), status).stream().map(this::toResponse).toList();
        }
        return repo.findByFreelancerId(actor.id()).stream().map(this::toResponse).toList();
    }

    public ContractResponse update(Long id, ContractRequest req, CurrentUser actor) {
        Contract contract = findContract(id);
        requireClientOwner(contract, actor);
        if (contract.getStatus() == ContractStatus.ACTIVE || contract.getStatus() == ContractStatus.COMPLETED) {
            throw new IllegalStateException("Only pending or draft contracts can be updated");
        }
        UserSummary freelancer = requireActiveVerifiedUser(userClient.getUserById(req.freelancerId()), "Freelancer");

        contract.setFreelancerId(req.freelancerId());
        contract.setTitle(req.title());
        contract.setScope(req.scope());
        contract.setTotalBudget(req.totalBudget());
        contract.setFreelancerName(displayName(freelancer));
        contract.setStartDate(req.startDate());
        contract.setEndDate(req.endDate());

        return toResponse(repo.save(contract));
    }

    public ContractResponse accept(Long id, CurrentUser actor) {
        Contract contract = findContract(id);
        requireFreelancerOwner(contract, actor);
        requirePendingAcceptance(contract);
        contract.setStatus(ContractStatus.ACTIVE);
        contract.setRespondedAt(LocalDateTime.now());
        return toResponse(repo.save(contract));
    }

    public ContractResponse reject(Long id, CurrentUser actor) {
        Contract contract = findContract(id);
        requireFreelancerOwner(contract, actor);
        requirePendingAcceptance(contract);
        contract.setStatus(ContractStatus.REJECTED);
        contract.setRespondedAt(LocalDateTime.now());
        return toResponse(repo.save(contract));
    }

    public ContractResponse complete(Long id, CurrentUser actor) {
        Contract contract = findContract(id);
        requireClientOwner(contract, actor);
        if (contract.getStatus() != ContractStatus.ACTIVE) {
            throw new IllegalStateException("Only active contracts can be completed");
        }
        contract.setStatus(ContractStatus.COMPLETED);
        return toResponse(repo.save(contract));
    }

    public void delete(Long id, CurrentUser actor) {
        Contract contract = findContract(id);
        requireClientOwner(contract, actor);
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

    private void requireClient(CurrentUser actor) {
        if (!actor.isClient()) {
            throw new IllegalStateException("Only clients can perform this action");
        }
    }

    private void requireClientOwner(Contract contract, CurrentUser actor) {
        requireClient(actor);
        if (!contract.getClientId().equals(actor.id())) {
            throw new IllegalStateException("You do not own this contract");
        }
    }

    private void requireFreelancerOwner(Contract contract, CurrentUser actor) {
        if (!actor.isFreelancer()) {
            throw new IllegalStateException("Only freelancers can perform this action");
        }
        if (!contract.getFreelancerId().equals(actor.id())) {
            throw new IllegalStateException("You are not assigned to this contract");
        }
    }

    private void requireParticipant(Contract contract, CurrentUser actor) {
        if (actor.isAdmin()) {
            return;
        }
        if (actor.isClient() && contract.getClientId().equals(actor.id())) {
            return;
        }
        if (actor.isFreelancer() && contract.getFreelancerId().equals(actor.id())) {
            return;
        }
        throw new IllegalStateException("You do not have access to this contract");
    }

    private UserSummary requireActiveVerifiedUser(UserSummary user, String label) {
        if (user == null || user.id() == null) {
            throw new IllegalStateException(label + " account was not found");
        }
        if (!Boolean.TRUE.equals(user.isActive())) {
            throw new IllegalStateException(label + " account is not active");
        }
        if (!Boolean.TRUE.equals(user.isVerified())) {
            throw new IllegalStateException(label + " account is not verified");
        }
        return user;
    }

    private String displayName(UserSummary user) {
        return (user.firstName() + " " + user.lastName()).trim();
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
