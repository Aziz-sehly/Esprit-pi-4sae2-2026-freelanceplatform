package com.esprit.microservice_proposal.Services;

import com.esprit.microservice_proposal.DTO.Project;
import com.esprit.microservice_proposal.DTO.User;
import com.esprit.microservice_proposal.Entity.Proposal;
import com.esprit.microservice_proposal.Feign.ProjectClient;
import com.esprit.microservice_proposal.Feign.UserClient;
import com.esprit.microservice_proposal.Repository.ProposalRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ServiceProposal implements IServiceProposal {

    @Autowired
    private ProposalRepository proposalRepository;

    @Autowired
    private ProjectClient projectClient;  // Feign

    @Autowired
    private UserClient userClient;        // Feign

    @Override
    public Proposal addProposal(Proposal proposal) {
        return proposalRepository.save(proposal);
    }

    @Override
    public Proposal updateProposal(int id, Proposal newProposal) {
        Proposal existing = proposalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Proposal not found"));

        existing.setProjectId(newProposal.getProjectId());
        existing.setFreelancerId(newProposal.getFreelancerId());
        existing.setProposedPrice(newProposal.getProposedPrice());
        existing.setDeliveryDays(newProposal.getDeliveryDays());
        existing.setCoverLetter(newProposal.getCoverLetter());
        existing.setStatus(newProposal.getStatus());
        existing.setIsInvited(newProposal.getIsInvited());
        existing.setRevisionsOffered(newProposal.getRevisionsOffered());

        return proposalRepository.save(existing);
    }

    @Override
    public List<Proposal> getProposals() {
        return proposalRepository.findAll();
    }

    @Override
    public Proposal getProposal(int id) {
        return proposalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Proposal not found"));
    }

    @Override
    public void deleteProposal(int id) {
        if (proposalRepository.existsById(id))
            proposalRepository.deleteById(id);
    }

    @Override
    public List<Proposal> getProposalsByProjectId(int projectId) {
        return proposalRepository.findByProjectId(projectId);
    }

    @Override
    public List<Proposal> getProposalsByFreelancerId(int freelancerId) {
        return proposalRepository.findByFreelancerId(freelancerId);
    }

    // ✅ Feign — récupérer Project depuis microservice_project
    @Override
    public Project getProjectById(int id) {
        return projectClient.getProjectById(id);
    }

    // ✅ Feign — récupérer User depuis microservice_user
    @Override
    public User getFreelancerById(int id) {
        return userClient.getUserById(id);
    }

    // ✅ Feign — récupérer tous les Projects
    @Override
    public List<Project> getAllProjects() {
        return projectClient.getAllProjects();
    }
}