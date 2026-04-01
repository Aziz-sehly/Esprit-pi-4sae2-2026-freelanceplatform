package com.esprit.microservice_proposal.Services;

import com.esprit.microservice_proposal.DTO.*;
import com.esprit.microservice_proposal.Entity.Proposal;
import java.util.List;

public interface IServiceProposal {
    // CRUD
    Proposal addProposal(Proposal proposal);
    Proposal updateProposal(int id, Proposal newProposal);
    List<Proposal> getProposals();
    Proposal getProposal(int id);
    void deleteProposal(int id);
    List<Proposal> getProposalsByProjectId(int projectId);
    List<Proposal> getProposalsByFreelancerId(int freelancerId);

    // Feign
    Project getProjectById(int id);
    User getFreelancerById(int id);
    List<Project> getAllProjects();

    // Stats
    ProposalStatsDTO getStatsByFreelancer(int freelancerId);

    // Smart Ranking
    List<RankedProposalDTO> getRankedProposals(int projectId);

    // Counter-Offer
    Proposal makeCounterOffer(int proposalId, CounterOfferRequest req);
    Proposal acceptCounterOffer(int proposalId);
    Proposal rejectCounterOffer(int proposalId);
}