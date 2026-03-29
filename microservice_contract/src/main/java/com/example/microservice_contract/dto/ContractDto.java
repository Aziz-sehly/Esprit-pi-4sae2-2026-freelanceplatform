package com.example.microservice_contract.dto;

import com.example.microservice_contract.Enum.ContractStatus;
import com.example.microservice_contract.Enum.PaymentStructure;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class ContractDto {

    // ── Create Request ─────────────────────────────────────────────────────────
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class CreateRequest {

        // IDs
        @NotNull private Long projectId;
        @NotNull private Long proposalId;
        @NotNull private Long freelancerId;
        @NotNull private Long clientId;

        // Client info — used to send signing email
        @NotBlank private String clientEmail;
        @NotBlank private String clientName;

        // Freelancer info — used to send signing email
        @NotBlank private String freelancerEmail;
        @NotBlank private String freelancerName;

        // Contract financials
        @NotNull @DecimalMin("0.01") private BigDecimal amount;
        @NotNull @DecimalMin("0") @DecimalMax("100") private BigDecimal platformFeePercentage;
        @NotNull private PaymentStructure paymentStructure;

        // Contract dates
        @NotNull private LocalDateTime startDate;
        @NotNull private LocalDateTime endDate;

        private String description;
    }

    // ── Update Status Request ──────────────────────────────────────────────────
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class UpdateStatusRequest {
        @NotNull private ContractStatus status;
    }

    // ── Response ───────────────────────────────────────────────────────────────
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class Response {
        private Long                              id;
        private Long                              projectId;
        private Long                              proposalId;
        private Long                              freelancerId;
        private Long                              clientId;
        private BigDecimal                        amount;
        private BigDecimal                        platformFeePercentage;
        private PaymentStructure                  paymentStructure;
        private ContractStatus                    status;
        private LocalDateTime                     startDate;
        private LocalDateTime                     endDate;
        private String                            description;
        private LocalDateTime                     createdAt;
        private LocalDateTime                     updatedAt;
        private List<ContractExtensionDto.Response>  extensions;
        private List<ContractSignatureDto.Response>  signatures;
    }
}