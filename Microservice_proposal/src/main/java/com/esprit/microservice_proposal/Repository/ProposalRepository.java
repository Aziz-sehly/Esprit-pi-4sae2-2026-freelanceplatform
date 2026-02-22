package com.esprit.microservice_proposal.Repository;

import com.esprit.microservice_proposal.Entity.Proposal;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProposalRepository extends JpaRepository<Proposal, Integer> {
    List<Proposal> findByProjectId(int projectId);
    List<Proposal> findByFreelancerId(int freelancerId);
}