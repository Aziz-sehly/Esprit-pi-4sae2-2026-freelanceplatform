package com.esprit.microservice_proposal.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ProposalStatsDTO {
    private int     freelancerId;
    private int     totalProposals;
    private int     acceptedProposals;
    private int     rejectedProposals;
    private int     pendingProposals;
    private double  acceptanceRate;       // 0..1
    private double  avgProposedPrice;
    private double  avgDeliveryDays;
    private long    avgResponseTimeHours; // createdAt → expiresAt


}