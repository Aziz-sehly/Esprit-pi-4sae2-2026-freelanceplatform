package com.esprit.microservice_proposal.Feign;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContractRequest {
    private Long projectId;
    private Long proposalId;
    private Long freelancerId;
    private Long clientId;
    private String clientEmail;
    private String clientName;
    private String freelancerEmail;
    private String freelancerName;
    private BigDecimal amount;
    private BigDecimal platformFeePercentage;
    private String paymentStructure;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String description;
}