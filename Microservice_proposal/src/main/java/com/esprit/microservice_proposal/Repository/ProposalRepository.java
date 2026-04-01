package com.esprit.microservice_proposal.Repository;

import com.esprit.microservice_proposal.Entity.Proposal;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.time.LocalDateTime;
import com.esprit.microservice_proposal.Entity.ProposalStatus;

public interface ProposalRepository extends JpaRepository<Proposal, Integer> {
    List<Proposal> findByProjectId(int projectId);
    List<Proposal> findByFreelancerId(int freelancerId);

    List<Proposal> findByStatus(ProposalStatus status);
    List<Proposal> findByFreelancerIdAndStatus(int freelancerId, ProposalStatus status);

    // Pour le scheduler d'expiration
    List<Proposal> findByStatusAndExpiresAtBefore(ProposalStatus status, LocalDateTime now);

    // Duplicate detection
    boolean existsByProjectIdAndFreelancerId(int projectId, int freelancerId);
}