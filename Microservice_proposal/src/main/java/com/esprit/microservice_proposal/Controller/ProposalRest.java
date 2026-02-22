package com.esprit.microservice_proposal.Controller;

import com.esprit.microservice_proposal.DTO.Project;
import com.esprit.microservice_proposal.DTO.User;
import com.esprit.microservice_proposal.Entity.Proposal;
import com.esprit.microservice_proposal.Services.IServiceProposal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/proposal")
public class ProposalRest {

    @Autowired
    IServiceProposal serviceProposal;

    @PostMapping("/AddProposal")
    public Proposal AddProposal(@RequestBody Proposal p) {
        return serviceProposal.addProposal(p);
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

    // ✅ Feign — afficher Project depuis microservice_project
    @GetMapping("/GetProject/{id}")
    public Project GetProject(@PathVariable int id) {
        return serviceProposal.getProjectById(id);
    }

    // ✅ Feign — afficher Freelancer depuis microservice_user
    @GetMapping("/GetFreelancer/{id}")
    public User GetFreelancer(@PathVariable int id) {
        return serviceProposal.getFreelancerById(id);
    }

    // ✅ Feign — afficher tous les Projects
    @GetMapping("/GetAllProjects")
    public List<Project> GetAllProjects() {
        return serviceProposal.getAllProjects();
    }
}