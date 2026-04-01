package com.esprit.microservice_proposal.Controller;

import com.esprit.microservice_proposal.DTO.*;
import com.esprit.microservice_proposal.Entity.Proposal;
import com.esprit.microservice_proposal.Services.AICoverLetterService;
import com.esprit.microservice_proposal.Services.IServiceProposal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/proposal")
public class ProposalRest {

    @Autowired IServiceProposal    serviceProposal;
    @Autowired AICoverLetterService aiCoverLetterService;

    // ── CRUD ──────────────────────────────────────────────────────────────────

    @PostMapping("/AddProposal")
    public ResponseEntity<?> AddProposal(@RequestBody Proposal p) {
        try {
            return ResponseEntity.ok(serviceProposal.addProposal(p));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/GetAllProposals")
    public List<Proposal> GetAllProposals() {
        return serviceProposal.getProposals();
    }

    @GetMapping("/GetProposal/{id}")
    public Proposal GetProposal(@PathVariable int id) {
        return serviceProposal.getProposal(id);
    }

    @PutMapping("/UpdateProposal/{id}")
    public Proposal UpdateProposal(@PathVariable int id, @RequestBody Proposal p) {
        return serviceProposal.updateProposal(id, p);
    }

    @DeleteMapping("/DeleteProposal/{id}")
    public void DeleteProposal(@PathVariable int id) {
        serviceProposal.deleteProposal(id);
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

    // ── AI COVER LETTER ───────────────────────────────────────────────────────

    /**
     * POST /proposal/ai-cover-letter
     * Body: { freelancerSkills, projectTitle, projectDescription, ... }
     */
    @PostMapping("/ai-cover-letter")
    public CoverLetterResponse generateCoverLetter(@RequestBody CoverLetterRequest req) {
        return aiCoverLetterService.generate(req);
    }

    // ── STATS ─────────────────────────────────────────────────────────────────

    /**
     * GET /proposal/stats/freelancer/{freelancerId}
     */
    @GetMapping("/stats/freelancer/{freelancerId}")
    public ProposalStatsDTO getFreelancerStats(@PathVariable int freelancerId) {
        return serviceProposal.getStatsByFreelancer(freelancerId);
    }

    // ── SMART RANKING ─────────────────────────────────────────────────────────

    /**
     * GET /proposal/ranked/{projectId}
     * Retourne les proposals classées par score
     */
    @GetMapping("/ranked/{projectId}")
    public List<RankedProposalDTO> getRankedProposals(@PathVariable int projectId) {
        return serviceProposal.getRankedProposals(projectId);
    }

    // ── COUNTER-OFFER ─────────────────────────────────────────────────────────

    /**
     * POST /proposal/{id}/counter-offer
     * Body: { counterPrice: 750, message: "We can offer $750" }
     */
    @PostMapping("/{id}/counter-offer")
    public ResponseEntity<?> makeCounterOffer(
            @PathVariable int id,
            @RequestBody CounterOfferRequest req) {
        try {
            return ResponseEntity.ok(serviceProposal.makeCounterOffer(id, req));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * PUT /proposal/{id}/counter-offer/accept
     * Le freelancer accepte le counter-offer
     */
    @PutMapping("/{id}/counter-offer/accept")
    public ResponseEntity<?> acceptCounterOffer(@PathVariable int id) {
        try {
            return ResponseEntity.ok(serviceProposal.acceptCounterOffer(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * PUT /proposal/{id}/counter-offer/reject
     * Le freelancer refuse le counter-offer
     */
    @PutMapping("/{id}/counter-offer/reject")
    public ResponseEntity<?> rejectCounterOffer(@PathVariable int id) {
        try {
            return ResponseEntity.ok(serviceProposal.rejectCounterOffer(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}