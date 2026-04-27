package com.milestone.milestone.services;

import com.milestone.milestone.dto.MilestoneFeedbackRequest;
import com.milestone.milestone.dto.MilestoneRequest;
import com.milestone.milestone.dto.MilestoneResponse;
import com.milestone.milestone.models.Contract;
import com.milestone.milestone.models.ContractStatus;
import com.milestone.milestone.models.Milestone;
import com.milestone.milestone.models.MilestoneStatus;
import com.milestone.milestone.repositories.ContractRepository;
import com.milestone.milestone.repositories.MilestoneRepository;
import com.milestone.milestone.security.CurrentUser;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MilestoneServiceTest {

    @Mock
    private MilestoneRepository repo;

    @Mock
    private ContractRepository contractRepository;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private MilestoneService milestoneService;

    @Test
    void createSavesPendingMilestoneForActiveContractOwnedByClient() {
        MilestoneRequest request = new MilestoneRequest(
                10L,
                "API delivery",
                "Deliver REST endpoints",
                new BigDecimal("500.00"),
                LocalDate.now().plusDays(7)
        );
        CurrentUser actor = new CurrentUser(3L, "client@test.com", "CLIENT");

        when(contractRepository.findById(10L)).thenReturn(Optional.of(activeContract()));
        when(repo.save(any(Milestone.class))).thenAnswer(invocation -> invocation.getArgument(0));

        MilestoneResponse response = milestoneService.create(request, actor);

        ArgumentCaptor<Milestone> milestoneCaptor = ArgumentCaptor.forClass(Milestone.class);
        verify(repo).save(milestoneCaptor.capture());
        Milestone saved = milestoneCaptor.getValue();

        assertEquals(MilestoneStatus.PENDING, saved.getStatus());
        assertEquals(0, saved.getRevisionCount());
        assertEquals(request.title(), saved.getTitle());
        assertEquals(request.amount(), response.amount());
    }

    @Test
    void submitRejectsPaidMilestone() {
        Milestone milestone = sampleMilestone();
        milestone.setStatus(MilestoneStatus.PAID);

        when(repo.findById(20L)).thenReturn(Optional.of(milestone));
        when(contractRepository.findById(10L)).thenReturn(Optional.of(activeContract()));

        IllegalStateException exception = assertThrows(
                IllegalStateException.class,
                () -> milestoneService.submit(20L, new CurrentUser(8L, "freelancer@test.com", "FREELANCER"))
        );

        assertEquals("Cannot submit milestone in status: PAID", exception.getMessage());
    }

    @Test
    void requestRevisionRejectsActorMismatch() {
        Milestone milestone = sampleMilestone();
        milestone.setStatus(MilestoneStatus.SUBMITTED);

        when(repo.findById(20L)).thenReturn(Optional.of(milestone));
        when(contractRepository.findById(10L)).thenReturn(Optional.of(activeContract()));

        IllegalStateException exception = assertThrows(
                IllegalStateException.class,
                () -> milestoneService.requestRevision(
                        20L,
                        new MilestoneFeedbackRequest("Please revise the UI", 999L),
                        new CurrentUser(3L, "client@test.com", "CLIENT")
                )
        );

        assertEquals("Revision actor does not match the authenticated user", exception.getMessage());
    }

    @Test
    void markFundedMarksApprovedMilestoneAsFunded() {
        Milestone milestone = sampleMilestone();
        milestone.setStatus(MilestoneStatus.APPROVED);

        when(repo.findById(20L)).thenReturn(Optional.of(milestone));
        when(repo.save(any(Milestone.class))).thenAnswer(invocation -> invocation.getArgument(0));

        MilestoneResponse response = milestoneService.markFunded(20L);

        assertEquals(MilestoneStatus.FUNDED, response.status());
        assertNotNull(milestone.getFundedAt());
        assertNotNull(milestone.getStatusUpdatedAt());
        verify(repo).save(milestone);
    }

    private Contract activeContract() {
        return Contract.builder()
                .id(10L)
                .clientId(3L)
                .freelancerId(8L)
                .title("Website")
                .scope("Build website")
                .totalBudget(new BigDecimal("1000.00"))
                .clientName("Client User")
                .freelancerName("Freelancer User")
                .status(ContractStatus.ACTIVE)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    private Milestone sampleMilestone() {
        return Milestone.builder()
                .id(20L)
                .contractId(10L)
                .title("Design delivery")
                .deliverable("Upload source files")
                .amount(new BigDecimal("400.00"))
                .dueDate(LocalDate.now().plusDays(5))
                .status(MilestoneStatus.PENDING)
                .revisionCount(0)
                .createdAt(LocalDateTime.now())
                .statusUpdatedAt(LocalDateTime.now())
                .build();
    }
}
