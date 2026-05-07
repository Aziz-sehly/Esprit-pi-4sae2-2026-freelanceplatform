package com.example.microservice_contract.dto;

import com.example.microservice_contract.Enum.ContractStatus;
import com.example.microservice_contract.Enum.PaymentStructure;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class ContractDto {

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class CreateRequest {

        @NotNull private Long projectId;
        @NotNull private Long proposalId;
        @NotNull private Long freelancerId;
        @NotNull private Long clientId;

        private String clientEmail;
        private String clientName;
        private String freelancerEmail;
        private String freelancerName;

        @NotNull @DecimalMin("0.01") private BigDecimal amount;
        @NotNull @DecimalMin("0") @DecimalMax("100") private BigDecimal platformFeePercentage;
        @NotNull private PaymentStructure paymentStructure;

        @NotNull private LocalDateTime startDate;
        @NotNull private LocalDateTime endDate;

        private String description;

        // Milestone data from proposal
        private Integer milestoneCount;
        private String  milestoneDetails;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class UpdateStatusRequest {
        @NotNull private ContractStatus status;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class Response {
        private Long                              id;
        private Long                              projectId;
        private Long                              proposalId;
        private Long                              freelancerId;
        private Long                              clientId;
        private String                            clientName;
        private String                            freelancerName;
        private BigDecimal                        amount;
        private BigDecimal                        platformFeePercentage;
        private PaymentStructure                  paymentStructure;
        private ContractStatus                    status;
        private LocalDateTime                     startDate;
        private LocalDateTime                     endDate;
        private String                            description;
        private Long                              milestoneId;
        private LocalDateTime                     createdAt;
        private LocalDateTime                     updatedAt;
        private List<ContractExtensionDto.Response>  extensions;
        private List<ContractSignatureDto.Response>  signatures;
    }
}