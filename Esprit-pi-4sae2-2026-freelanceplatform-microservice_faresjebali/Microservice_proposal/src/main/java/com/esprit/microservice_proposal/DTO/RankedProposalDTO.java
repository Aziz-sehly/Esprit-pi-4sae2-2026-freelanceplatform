package com.esprit.microservice_proposal.DTO;

import com.esprit.microservice_proposal.Entity.Proposal;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RankedProposalDTO {
    private Proposal proposal;
    private double   score;
    private String   scoreBreakdown; // ex: "Price:40 | Delivery:35 | Revisions:25"
}