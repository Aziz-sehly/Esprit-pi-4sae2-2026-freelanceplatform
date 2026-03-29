package com.example.microservice_contract.dto;

import com.example.microservice_contract.Enum.SignatureStatus;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDateTime;

public class ContractSignatureDto {

    // ── 1. Client initiates a signature request ────────────────────────────────
    // Called once per signer to create a token and send the signing email
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class CreateRequest {
        @NotNull  private Long   signerId;
        @NotBlank private String signerRole;   // "CLIENT" or "FREELANCER"
        @NotBlank private String signerEmail;  // used to send the signing link
        @NotBlank private String signerName;   // used in the email greeting
    }

    // ── 2. Signer submits their drawn signature ────────────────────────────────
    // Called from the signing page after the user draws their signature
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class SignRequest {
        @NotBlank private String token;         // the unique signing token from the email link
        @NotBlank private String signatureData; // base64-encoded PNG from canvas
        private String ipAddress;
    }

    // ── 3. Update status manually (admin use) ─────────────────────────────────
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class UpdateRequest {
        @NotNull private SignatureStatus status;
        private String signatureData;
        private String ipAddress;
    }

    // ── Response ───────────────────────────────────────────────────────────────
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class Response {
        private Long            id;
        private Long            contractId;
        private Long            signerId;
        private String          signerRole;
        private String          signerEmail;
        private String          signerName;
        private SignatureStatus  status;
        private String          signatureData;
        private String          token;          // returned so frontend can build signing link
        private String          ipAddress;
        private LocalDateTime   signedAt;
        private LocalDateTime   expiresAt;
        private LocalDateTime   createdAt;
       private boolean  signed;
    }
}