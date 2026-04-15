package com.esprit.microservice_proposal.Feign;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;




@JsonIgnoreProperties(ignoreUnknown = true)  // ← THIS
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ContractResponse {
    private Long id;
    private Long projectId;
    private Long proposalId;
    private String clientName;
    private String freelancerName;
    private Long freelancerId;
    private Long clientId;
    private BigDecimal amount;
    private BigDecimal platformFeePercentage;
    private String paymentStructure;
    private String status;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String description;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<Object> extensions;
    private List<Object> signatures;
}