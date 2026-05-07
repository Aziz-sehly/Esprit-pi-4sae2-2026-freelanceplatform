package com.esprit.microservice_proposal.Services;

import com.esprit.microservice_proposal.Entity.Proposal;
import com.esprit.microservice_proposal.Entity.ProposalStatus;
import com.esprit.microservice_proposal.Repository.ProposalRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProposalSchedulerService {

    private final ProposalRepository proposalRepository;

    /**
     * Tourne toutes les heures — expire les proposals PENDING dont expiresAt < now
     * Cron: chaque heure à minute 0
     */
    @Scheduled(cron = "0 0 * * * *")
    public void expireProposals() {
        List<Proposal> expired = proposalRepository
                .findByStatusAndExpiresAtBefore(ProposalStatus.PENDING, LocalDateTime.now());

        if (expired.isEmpty()) return;

        expired.forEach(p -> {
            p.setStatus(ProposalStatus.WITHDRAWN);
            log.info("Proposal {} auto-expired (freelancerId={})", p.getId(), p.getFreelancerId());
        });

        proposalRepository.saveAll(expired);
        log.info("✅ {} proposals auto-expired", expired.size());
    }
}