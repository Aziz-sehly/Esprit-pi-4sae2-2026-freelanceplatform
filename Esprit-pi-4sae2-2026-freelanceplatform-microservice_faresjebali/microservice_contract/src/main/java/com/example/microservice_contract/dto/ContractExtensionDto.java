package com.example.microservice_contract.dto;

import com.example.microservice_contract.Enum.ExtensionStatus;
import com.example.microservice_contract.Enum.ExtensionType;
import com.example.microservice_contract.Enum.RequestingParty;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class ContractExtensionDto {

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class CreateRequest {
        @NotNull @Min(1) private Integer additionalDays;
        @NotNull private ExtensionType extensionType;
        @NotNull private RequestingParty requestingParty;
        @Size(max = 1000) private String requesterNote;
        @DecimalMin("0") private BigDecimal proposedAmount;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ReviewRequest {
        @NotNull private ExtensionStatus status;   // APPROVED or REJECTED
        @Size(max = 1000) private String responderNote;
        @DecimalMin("0") private BigDecimal suggestedAmount;
        private String riskAlerts;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class Response {
        private Long id;
        private Long contractId;
        private Integer additionalDays;
        private ExtensionType extensionType;
        private RequestingParty requestingParty;
        private ExtensionStatus status;
        private BigDecimal proposedAmount;
        private BigDecimal suggestedAmount;
        private String requesterNote;
        private String responderNote;
        private String riskAlerts;
        private LocalDateTime requestedAt;
        private LocalDateTime resolvedAt;
    }
}