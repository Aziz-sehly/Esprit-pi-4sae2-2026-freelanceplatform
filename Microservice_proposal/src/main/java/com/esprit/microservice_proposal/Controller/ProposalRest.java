package com.esprit.microservice_proposal.Controller;

import com.esprit.microservice_proposal.DTO.*;
import com.esprit.microservice_proposal.Entity.Proposal;
import com.esprit.microservice_proposal.Feign.ContractResponse;
import com.esprit.microservice_proposal.Services.AICoverLetterService;
import com.esprit.microservice_proposal.Services.IServiceProposal;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/proposal")
@RequiredArgsConstructor
public class ProposalRest {

    private final IServiceProposal serviceProposal;
    private final AICoverLetterService aiCoverLetterService;

    // ── CRUD ──────────────────────────────────────────────────────────────────

    // Only FREELANCER can submit a proposal
    @PreAuthorize("hasAuthority('FREELANCER')")
    @PostMapping("/AddProposal")
    public ResponseEntity<?> AddProposal(@RequestBody Proposal p,
                                         HttpServletRequest request) {
        try {
            // Force freelancerId to be the authenticated user
            Long userId = (Long) request.getAttribute("userId");
            p.setFreelancerId(userId.intValue());
            return ResponseEntity.ok(serviceProposal.addProposal(p));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Any authenticated user can view proposals
    @GetMapping("/GetAllProposals")
    public List<Proposal> GetAllProposals() {
        return serviceProposal.getProposals();
    }

    @GetMapping("/GetProposal/{id}")
    public Proposal GetProposal(@PathVariable int id) {
        return serviceProposal.getProposal(id);
    }

    // Only FREELANCER can update their own proposal
    @PreAuthorize("hasAuthority('FREELANCER')")
    @PutMapping("/UpdateProposal/{id}")
    public ResponseEntity<?> UpdateProposal(@PathVariable int id,
                                            @RequestBody Proposal p,
                                            HttpServletRequest request) {
        try {
            Long userId = (Long) request.getAttribute("userId");
            Proposal existing = serviceProposal.getProposal(id);
            if (!existing.getFreelancerId().equals(userId.intValue())) {
                return ResponseEntity.status(403).body("You can only update your own proposals");
            }
            return ResponseEntity.ok(serviceProposal.updateProposal(id, p));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Only FREELANCER can delete their own proposal
    @PreAuthorize("hasAuthority('FREELANCER')")
    @DeleteMapping("/DeleteProposal/{id}")
    public ResponseEntity<?> DeleteProposal(@PathVariable int id,
                                            HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        Proposal existing = serviceProposal.getProposal(id);
        if (!existing.getFreelancerId().equals(userId.intValue())) {
            return ResponseEntity.status(403).body("You can only delete your own proposals");
        }
        serviceProposal.deleteProposal(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/GetProposalsByProject/{projectId}")
    public List<Proposal> GetProposalsByProject(@PathVariable int projectId) {
        return serviceProposal.getProposalsByProjectId(projectId);
    }

    @GetMapping("/GetProposalsByFreelancer/{freelancerId}")
    public List<Proposal> GetProposalsByFreelancer(@PathVariable int freelancerId) {
        return serviceProposal.getProposalsByFreelancerId(freelancerId);
    }

    // ── FEIGN ─────────────────────────────────────────────────────────────────

    @GetMapping("/GetProject/{id}")
    public Project GetProject(@PathVariable int id) {
        return serviceProposal.getProjectById(id);
    }

    @GetMapping("/GetFreelancer/{id}")
    public User GetFreelancer(@PathVariable int id) {
        return serviceProposal.getFreelancerById(id);
    }

    @GetMapping("/GetAllProjects")
    public List<Project> GetAllProjects() {
        return serviceProposal.getAllProjects();
    }

    // ── ACCEPT PROPOSAL → CONTRACT ────────────────────────────────────────────

    // Only CLIENT can accept a proposal
    @PreAuthorize("hasAuthority('CLIENT')")
    @PostMapping("/Accept/{proposalId}")
    public ResponseEntity<?> AcceptProposal(@PathVariable int proposalId,
                                            HttpServletRequest request) {
        try {
            Long clientId = (Long) request.getAttribute("userId");
            return ResponseEntity.ok(serviceProposal.acceptProposal(proposalId, clientId.intValue()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ── AI COVER LETTER ───────────────────────────────────────────────────────

    @PreAuthorize("hasAuthority('FREELANCER')")
    @PostMapping("/ai-cover-letter")
    public CoverLetterResponse generateCoverLetter(@RequestBody CoverLetterRequest req) {
        return aiCoverLetterService.generate(req);
    }

    // ── STATS ─────────────────────────────────────────────────────────────────

    @GetMapping("/stats/freelancer/{freelancerId}")
    public ProposalStatsDTO getFreelancerStats(@PathVariable int freelancerId) {
        return serviceProposal.getStatsByFreelancer(freelancerId);
    }

    // ── SMART RANKING ─────────────────────────────────────────────────────────

    @GetMapping("/ranked/{projectId}")
    public List<RankedProposalDTO> getRankedProposals(@PathVariable int projectId) {
        return serviceProposal.getRankedProposals(projectId);
    }

    // ── COUNTER-OFFER ─────────────────────────────────────────────────────────

    // CLIENT makes a counter-offer
    @PreAuthorize("hasAuthority('CLIENT')")
    @PostMapping("/{id}/counter-offer")
    public ResponseEntity<?> makeCounterOffer(@PathVariable int id,
                                              @RequestBody CounterOfferRequest req) {
        try {
            return ResponseEntity.ok(serviceProposal.makeCounterOffer(id, req));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // FREELANCER accepts the counter-offer
    @PreAuthorize("hasAuthority('FREELANCER')")
    @PutMapping("/{id}/counter-offer/accept")
    public ResponseEntity<?> acceptCounterOffer(@PathVariable int id) {
        try {
            return ResponseEntity.ok(serviceProposal.acceptCounterOffer(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // FREELANCER rejects the counter-offer
    @PreAuthorize("hasAuthority('FREELANCER')")
    @PutMapping("/{id}/counter-offer/reject")
    public ResponseEntity<?> rejectCounterOffer(@PathVariable int id) {
        try {
            return ResponseEntity.ok(serviceProposal.rejectCounterOffer(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}