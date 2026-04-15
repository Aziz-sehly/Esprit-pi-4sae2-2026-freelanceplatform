package com.prolance.dispute.service;

import com.prolance.dispute.client.MediaAnalysisFeignClient;
import com.prolance.dispute.client.MessageClient;
import com.prolance.dispute.domain.Dispute;
import com.prolance.dispute.domain.DisputeAuditEvent;
import com.prolance.dispute.domain.DisputeStatus;
import com.prolance.dispute.domain.Evidence;
import com.prolance.dispute.repository.DisputeAuditEventRepository;
import com.prolance.dispute.repository.DisputeRepository;
import com.prolance.dispute.repository.EvidenceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DisputeServiceAccessTest {

    @Mock
    private DisputeRepository disputeRepository;
    @Mock
    private MessageClient messageClient;
    @Mock
    private EvidenceRepository evidenceRepository;
    @Mock
    private DisputeAuditEventRepository auditRepo;
    @Mock
    private DisputeInsightsCalculator insightsCalculator;
    @Mock
    private MediaAnalysisFeignClient mediaAnalysisFeignClient;

    private DisputeService service;

    @BeforeEach
    void setUp() {
        service = new DisputeService(
                disputeRepository,
                messageClient,
                evidenceRepository,
                auditRepo,
                insightsCalculator,
                mediaAnalysisFeignClient
        );
        ReflectionTestUtils.setField(service, "deadlineDays", 7);
        ReflectionTestUtils.setField(service, "mediaAnalysisEnabled", true);
    }

    @Test
    void getInsights_requiresAdminRole() {
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.getInsights(1L, "10", "ROLE_USER"));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
        verify(disputeRepository, never()).findById(any());
    }

    @Test
    void deleteEvidence_allowsDisputeOwnerEvenIfNotUploader() {
        Dispute dispute = dispute(5L, 10L);
        Evidence evidence = evidence(77L, 5L, 20L, false);
        when(disputeRepository.findById(5L)).thenReturn(Optional.of(dispute));
        when(evidenceRepository.findById(77L)).thenReturn(Optional.of(evidence));

        service.deleteEvidence(5L, 77L, "10", "ROLE_USER");

        verify(evidenceRepository).delete(evidence);
        verify(auditRepo).save(any(DisputeAuditEvent.class));
    }

    @Test
    void deleteEvidence_rejectsUnrelatedNonAdmin() {
        Dispute dispute = dispute(5L, 10L);
        Evidence evidence = evidence(77L, 5L, 20L, false);
        when(disputeRepository.findById(5L)).thenReturn(Optional.of(dispute));
        when(evidenceRepository.findById(77L)).thenReturn(Optional.of(evidence));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.deleteEvidence(5L, 77L, "30", "ROLE_USER"));

        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
        verify(evidenceRepository, never()).delete(any(Evidence.class));
    }

    @Test
    void deleteEvidence_adminCanDeleteLockedEvidence() {
        Dispute dispute = dispute(5L, 10L);
        Evidence evidence = evidence(77L, 5L, 20L, true);
        when(disputeRepository.findById(5L)).thenReturn(Optional.of(dispute));
        when(evidenceRepository.findById(77L)).thenReturn(Optional.of(evidence));

        service.deleteEvidence(5L, 77L, "99", "ROLE_ADMIN");

        verify(evidenceRepository).delete(evidence);
    }

    private static Dispute dispute(Long id, Long raisedBy) {
        Dispute d = new Dispute();
        ReflectionTestUtils.setField(d, "id", id);
        d.setRaisedByUserId(raisedBy);
        d.setStatus(DisputeStatus.OPEN);
        d.setCreatedAt(LocalDateTime.now().minusDays(1));
        d.setDeadlineAt(LocalDateTime.now().plusDays(2));
        return d;
    }

    private static Evidence evidence(Long id, Long disputeId, Long uploaderId, boolean locked) {
        Evidence e = new Evidence();
        e.setId(id);
        e.setDisputeId(disputeId);
        e.setUploaderUserId(uploaderId);
        e.setFileUrl("/messages/attachments/x.jpg");
        e.setFileName("x.jpg");
        e.setCategory("OTHER");
        e.setAdminLocked(locked);
        e.setCreatedAt(LocalDateTime.now().minusHours(2));
        return e;
    }
}
