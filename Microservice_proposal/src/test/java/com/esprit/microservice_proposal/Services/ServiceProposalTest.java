package com.esprit.microservice_proposal.Services;

import com.esprit.microservice_proposal.DTO.*;
import com.esprit.microservice_proposal.Entity.Proposal;
import com.esprit.microservice_proposal.Entity.ProposalStatus;
import com.esprit.microservice_proposal.Feign.ContractClient;
import com.esprit.microservice_proposal.Feign.ProjectClient;
import com.esprit.microservice_proposal.Feign.UserClient;
import com.esprit.microservice_proposal.Repository.ProposalRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ServiceProposalTest {

    @Mock
    private ProposalRepository proposalRepository;

    @Mock
    private ProjectClient projectFeignClient;

    @Mock
    private UserClient userClient;

    @Mock
    private ContractClient contractClient;

    @InjectMocks
    private ServiceProposal serviceProposal;

    private Proposal proposal1;
    private Proposal proposal2;

    @BeforeEach
    void setUp() {
        proposal1 = new Proposal();
        proposal1.setId(1);
        proposal1.setProjectId(10);
        proposal1.setFreelancerId(100);
        proposal1.setProposedPrice(500.0f);
        proposal1.setDeliveryDays(14);
        proposal1.setCoverLetter("I am the best candidate");
        proposal1.setRevisionsOffered(3);
        proposal1.setStatus(ProposalStatus.PENDING);
        proposal1.setCreatedAt(LocalDateTime.now());
        proposal1.setExpiresAt(LocalDateTime.now().plusDays(14));

        proposal2 = new Proposal();
        proposal2.setId(2);
        proposal2.setProjectId(10);
        proposal2.setFreelancerId(200);
        proposal2.setProposedPrice(800.0f);
        proposal2.setDeliveryDays(7);
        proposal2.setCoverLetter("Quick delivery guaranteed");
        proposal2.setRevisionsOffered(5);
        proposal2.setStatus(ProposalStatus.PENDING);
        proposal2.setCreatedAt(LocalDateTime.now());
        proposal2.setExpiresAt(LocalDateTime.now().plusDays(14));
    }

    // ===================== addProposal =====================
    @Test
    void testAddProposal_success() {
        when(proposalRepository.existsByProjectIdAndFreelancerId(10, 100))
                .thenReturn(false);
        when(proposalRepository.save(any(Proposal.class)))
                .thenReturn(proposal1);

        Proposal result = serviceProposal.addProposal(proposal1);

        assertNotNull(result);
        assertEquals(ProposalStatus.PENDING, result.getStatus());
        verify(proposalRepository).save(any(Proposal.class));
    }

    @Test
    void testAddProposal_duplicate_throwsException() {
        when(proposalRepository.existsByProjectIdAndFreelancerId(10, 100))
                .thenReturn(true);

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> serviceProposal.addProposal(proposal1));

        assertTrue(ex.getMessage().contains("already submitted"));
        verify(proposalRepository, never()).save(any());
    }

    // ===================== getProposals =====================
    @Test
    void testGetProposals_returnsAll() {
        when(proposalRepository.findAll())
                .thenReturn(Arrays.asList(proposal1, proposal2));

        List<Proposal> result = serviceProposal.getProposals();

        assertEquals(2, result.size());
        verify(proposalRepository).findAll();
    }

    @Test
    void testGetProposals_empty() {
        when(proposalRepository.findAll()).thenReturn(List.of());

        List<Proposal> result = serviceProposal.getProposals();

        assertTrue(result.isEmpty());
    }

    // ===================== getProposal =====================
    @Test
    void testGetProposal_found() {
        when(proposalRepository.findById(1))
                .thenReturn(Optional.of(proposal1));

        Proposal result = serviceProposal.getProposal(1);

        assertNotNull(result);
        assertEquals(1, result.getId());
    }

    @Test
    void testGetProposal_notFound_throwsException() {
        when(proposalRepository.findById(99))
                .thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> serviceProposal.getProposal(99));

        assertTrue(ex.getMessage().contains("Proposal not found"));
    }

    // ===================== updateProposal =====================
    @Test
    void testUpdateProposal_success() {
        Proposal updates = new Proposal();
        updates.setProposedPrice(600.0f);
        updates.setDeliveryDays(10);
        updates.setCoverLetter("Updated letter");
        updates.setRevisionsOffered(4);
        updates.setStatus(ProposalStatus.PENDING);

        when(proposalRepository.findById(1))
                .thenReturn(Optional.of(proposal1));
        when(proposalRepository.save(any(Proposal.class)))
                .thenReturn(proposal1);

        Proposal result = serviceProposal.updateProposal(1, updates);

        assertNotNull(result);
        verify(proposalRepository).save(any(Proposal.class));
    }

    @Test
    void testUpdateProposal_notFound_throwsException() {
        when(proposalRepository.findById(99))
                .thenReturn(Optional.empty());

        assertThrows(RuntimeException.class,
                () -> serviceProposal.updateProposal(99, new Proposal()));
    }

    // ===================== deleteProposal =====================
    @Test
    void testDeleteProposal_exists() {
        when(proposalRepository.existsById(1)).thenReturn(true);
        doNothing().when(proposalRepository).deleteById(1);

        serviceProposal.deleteProposal(1);

        verify(proposalRepository).deleteById(1);
    }

    @Test
    void testDeleteProposal_notExists_doesNothing() {
        when(proposalRepository.existsById(99)).thenReturn(false);

        serviceProposal.deleteProposal(99);

        verify(proposalRepository, never()).deleteById(99);
    }

    // ===================== rejectProposal =====================
    @Test
    void testRejectProposal_success() {
        when(proposalRepository.findById(1))
                .thenReturn(Optional.of(proposal1));
        when(proposalRepository.save(any(Proposal.class)))
                .thenReturn(proposal1);

        Proposal result = serviceProposal.rejectProposal(1, 999);

        assertNotNull(result);
        assertEquals(ProposalStatus.REJECTED, result.getStatus());
        verify(proposalRepository).save(any(Proposal.class));
    }

    // ===================== getProposalsByProjectId =====================
    @Test
    void testGetProposalsByProjectId() {
        when(proposalRepository.findByProjectId(10))
                .thenReturn(Arrays.asList(proposal1, proposal2));

        List<Proposal> result = serviceProposal.getProposalsByProjectId(10);

        assertEquals(2, result.size());
        verify(proposalRepository).findByProjectId(10);
    }

    // ===================== getProposalsByFreelancerId =====================
    @Test
    void testGetProposalsByFreelancerId() {
        when(proposalRepository.findByFreelancerId(100))
                .thenReturn(List.of(proposal1));

        List<Proposal> result = serviceProposal.getProposalsByFreelancerId(100);

        assertEquals(1, result.size());
        verify(proposalRepository).findByFreelancerId(100);
    }



    // ===================== makeCounterOffer =====================
    @Test
    void testMakeCounterOffer_success() {
        CounterOfferRequest req = new CounterOfferRequest();
        req.setCounterPrice(450.0f);
        req.setMessage("Can you do it for less?");

        when(proposalRepository.findById(1))
                .thenReturn(Optional.of(proposal1));
        when(proposalRepository.save(any(Proposal.class)))
                .thenReturn(proposal1);

        Proposal result = serviceProposal.makeCounterOffer(1, req);

        assertNotNull(result);
        assertEquals(ProposalStatus.NEGOTIATING, result.getStatus());
        verify(proposalRepository).save(any(Proposal.class));
    }

    @Test
    void testMakeCounterOffer_notPending_throwsException() {
        proposal1.setStatus(ProposalStatus.ACCEPTED);

        when(proposalRepository.findById(1))
                .thenReturn(Optional.of(proposal1));

        CounterOfferRequest req = new CounterOfferRequest();
        req.setCounterPrice(400.0f);

        assertThrows(RuntimeException.class,
                () -> serviceProposal.makeCounterOffer(1, req));
    }

    // ===================== acceptCounterOffer =====================
    @Test
    void testAcceptCounterOffer_success() {
        proposal1.setStatus(ProposalStatus.NEGOTIATING);
        proposal1.setCounterOfferPrice(450.0f);

        when(proposalRepository.findById(1))
                .thenReturn(Optional.of(proposal1));
        when(proposalRepository.save(any(Proposal.class)))
                .thenReturn(proposal1);

        Proposal result = serviceProposal.acceptCounterOffer(1);

        assertNotNull(result);
        assertEquals(ProposalStatus.ACCEPTED, result.getStatus());
        assertEquals(450.0f, result.getProposedPrice());
    }

    @Test
    void testAcceptCounterOffer_notNegotiating_throwsException() {
        proposal1.setStatus(ProposalStatus.PENDING);

        when(proposalRepository.findById(1))
                .thenReturn(Optional.of(proposal1));

        assertThrows(RuntimeException.class,
                () -> serviceProposal.acceptCounterOffer(1));
    }

    // ===================== rejectCounterOffer =====================
    @Test
    void testRejectCounterOffer_success() {
        proposal1.setStatus(ProposalStatus.NEGOTIATING);

        when(proposalRepository.findById(1))
                .thenReturn(Optional.of(proposal1));
        when(proposalRepository.save(any(Proposal.class)))
                .thenReturn(proposal1);

        Proposal result = serviceProposal.rejectCounterOffer(1);

        assertNotNull(result);
        assertEquals(ProposalStatus.REJECTED, result.getStatus());
    }

    @Test
    void testRejectCounterOffer_notNegotiating_throwsException() {
        proposal1.setStatus(ProposalStatus.PENDING);

        when(proposalRepository.findById(1))
                .thenReturn(Optional.of(proposal1));

        assertThrows(RuntimeException.class,
                () -> serviceProposal.rejectCounterOffer(1));
    }
}