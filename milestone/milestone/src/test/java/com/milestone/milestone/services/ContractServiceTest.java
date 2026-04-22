package com.milestone.milestone.services;

import com.milestone.milestone.client.UserClient;
import com.milestone.milestone.dto.ContractRequest;
import com.milestone.milestone.dto.ContractResponse;
import com.milestone.milestone.dto.UserSummary;
import com.milestone.milestone.models.Contract;
import com.milestone.milestone.models.ContractStatus;
import com.milestone.milestone.repositories.ContractRepository;
import com.milestone.milestone.repositories.MilestoneRepository;
import com.milestone.milestone.security.CurrentUser;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ContractServiceTest {

    @Mock
    private ContractRepository repo;
    @Mock
    private MilestoneRepository milestoneRepository;
    @Mock
    private UserClient userClient;

    @InjectMocks
    private ContractService contractService;

    @Test
    void create_buildsPendingContract_withDisplayNames() {
        CurrentUser actor = new CurrentUser(2L, "client@test.com", "CLIENT");
        ContractRequest request = new ContractRequest(
                2L,
                6L,
                "Website build",
                "Build a company website",
                new BigDecimal("1500.00"),
                "Ignored Client Name",
                "Ignored Freelancer Name",
                LocalDate.now(),
                LocalDate.now().plusDays(30)
        );

        when(userClient.getUserById(2L)).thenReturn(activeVerifiedUser(2L, "Client", "User"));
        when(userClient.getUserById(6L)).thenReturn(activeVerifiedUser(6L, "Free", "Lancer"));
        when(repo.save(any(Contract.class))).thenAnswer(invocation -> {
            Contract contract = invocation.getArgument(0);
            contract.setId(21L);
            contract.setCreatedAt(LocalDateTime.now());
            contract.setUpdatedAt(LocalDateTime.now());
            return contract;
        });

        ContractResponse response = contractService.create(request, actor);

        assertThat(response.id()).isEqualTo(21L);
        assertThat(response.status()).isEqualTo(ContractStatus.PENDING_ACCEPTANCE);
        assertThat(response.clientName()).isEqualTo("Client User");
        assertThat(response.freelancerName()).isEqualTo("Free Lancer");

        ArgumentCaptor<Contract> savedContract = ArgumentCaptor.forClass(Contract.class);
        verify(repo).save(savedContract.capture());
        assertThat(savedContract.getValue().getClientId()).isEqualTo(2L);
        assertThat(savedContract.getValue().getFreelancerId()).isEqualTo(6L);
    }

    private UserSummary activeVerifiedUser(Long id, String firstName, String lastName) {
        return new UserSummary(
                id,
                firstName.toLowerCase() + "@test.com",
                firstName,
                lastName,
                "USER",
                null,
                null,
                null,
                null,
                null,
                null,
                true,
                true
        );
    }
}
