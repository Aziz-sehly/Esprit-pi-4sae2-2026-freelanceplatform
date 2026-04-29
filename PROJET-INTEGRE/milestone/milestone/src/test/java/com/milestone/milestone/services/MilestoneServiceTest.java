package com.milestone.milestone.services;

import com.milestone.milestone.controllers.MilestoneController.InternalMilestoneRequest;
import com.milestone.milestone.dto.MilestoneFeedbackRequest;
import com.milestone.milestone.dto.MilestoneResponse;
import com.milestone.milestone.dto.NotificationMessage;
import com.milestone.milestone.feign.ContractClient;
import com.milestone.milestone.feign.DisputeClient;
import com.milestone.milestone.models.Milestone;
import com.milestone.milestone.models.MilestoneStatus;
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
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MilestoneServiceTest {

    @Mock
    private MilestoneRepository repo;
    @Mock
    private ContractClient contractClient;
    @Mock
    private DisputeClient disputeClient;
    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private MilestoneService milestoneService;

    @Test
    void createInternal_savesPendingMilestone_andReturnsResponse() {
        InternalMilestoneRequest request = new InternalMilestoneRequest(
                9L,
                "Design phase",
                "Landing page mockups",
                new BigDecimal("250.00"),
                LocalDate.now().plusDays(7)
        );

        when(repo.save(any(Milestone.class))).thenAnswer(invocation -> {
            Milestone milestone = invocation.getArgument(0);
            milestone.setId(15L);
            milestone.setCreatedAt(LocalDateTime.now());
            milestone.setStatusUpdatedAt(LocalDateTime.now());
            return milestone;
        });

        MilestoneResponse response = milestoneService.createInternal(request);

        assertThat(response.id()).isEqualTo(15L);
        assertThat(response.status()).isEqualTo(MilestoneStatus.PENDING);
        assertThat(response.title()).isEqualTo("Design phase");

        ArgumentCaptor<String> destinationCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<NotificationMessage> payloadCaptor = ArgumentCaptor.forClass(NotificationMessage.class);
        verify(messagingTemplate, times(2)).convertAndSend(destinationCaptor.capture(), payloadCaptor.capture());

        assertThat(destinationCaptor.getAllValues()).containsExactly(
                "/topic/notifications",
                "/topic/contracts/9"
        );
        assertThat(payloadCaptor.getAllValues())
                .extracting(NotificationMessage::type, NotificationMessage::contractId, NotificationMessage::milestoneId)
                .containsOnly(
                        org.assertj.core.groups.Tuple.tuple("MILESTONE_CREATED", 9L, 15L)
                );
    }

    @Test
    void approve_marksSubmittedMilestoneApproved_forClientOwner() {
        Milestone milestone = sampleMilestone(MilestoneStatus.SUBMITTED);
        CurrentUser actor = new CurrentUser(2L, "client@test.com", "CLIENT");

        when(repo.findById(11L)).thenReturn(Optional.of(milestone));
        when(contractClient.getById(9L)).thenReturn(activeContract());
        when(disputeClient.hasBlockingDispute(9L)).thenReturn(Map.of("blocking", false));
        when(repo.save(any(Milestone.class))).thenAnswer(invocation -> invocation.getArgument(0));

        MilestoneResponse response = milestoneService.approve(11L, actor);

        assertThat(response.status()).isEqualTo(MilestoneStatus.APPROVED);
        ArgumentCaptor<Milestone> savedMilestone = ArgumentCaptor.forClass(Milestone.class);
        verify(repo).save(savedMilestone.capture());
        assertThat(savedMilestone.getValue().getClientApprovedAt()).isNotNull();
    }

    @Test
    void requestRevision_rejectsActorMismatch() {
        Milestone milestone = sampleMilestone(MilestoneStatus.SUBMITTED);
        CurrentUser actor = new CurrentUser(2L, "client@test.com", "CLIENT");
        MilestoneFeedbackRequest request = new MilestoneFeedbackRequest(
                "Please update the delivery",
                99L
        );

        when(repo.findById(11L)).thenReturn(Optional.of(milestone));
        when(contractClient.getById(9L)).thenReturn(activeContract());
        when(disputeClient.hasBlockingDispute(9L)).thenReturn(Map.of("blocking", false));

        assertThatThrownBy(() -> milestoneService.requestRevision(11L, request, actor))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Revision actor does not match");
    }

    private Milestone sampleMilestone(MilestoneStatus status) {
        return Milestone.builder()
                .id(11L)
                .contractId(9L)
                .title("Phase 1")
                .deliverable("Initial delivery")
                .amount(new BigDecimal("300.00"))
                .dueDate(LocalDate.now().plusDays(5))
                .status(status)
                .revisionCount(0)
                .createdAt(LocalDateTime.now())
                .statusUpdatedAt(LocalDateTime.now())
                .build();
    }

    private ContractClient.ContractDto activeContract() {
        return new ContractClient.ContractDto(
                9L,
                2L,
                6L,
                "Client User",
                "Freelancer User",
                new BigDecimal("1000.00"),
                "MILESTONE",
                "ACTIVE",
                LocalDateTime.now().minusDays(2),
                LocalDateTime.now().plusDays(20)
        );
    }
}
