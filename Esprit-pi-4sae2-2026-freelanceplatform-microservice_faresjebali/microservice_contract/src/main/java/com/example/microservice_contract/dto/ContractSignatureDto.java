package com.example.microservice_contract.dto;

import com.example.microservice_contract.Enum.SignatureStatus;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDateTime;

public class ContractSignatureDto {

    // ── 1. Initiate a signature request ───────────────────────────────────────
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class CreateRequest {
        @NotNull  private Long   signerId;
        @NotBlank private String signerRole;
        @NotBlank private String signerEmail;
        @NotBlank private String signerName;
    }

    // ── 2. Submit the drawn / uploaded signature ───────────────────────────────
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class SignRequest {
        @NotBlank private String token;
        @NotBlank private String signatureData;
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
        // Identity
        private Long            id;
        private Long            contractId;
        private Long            signerId;
        private String          signerRole;
        private String          signerEmail;
        private String          signerName;

        // Workflow
        private SignatureStatus status;
        private String          token;
        private LocalDateTime   expiresAt;
        private LocalDateTime   createdAt;
        private boolean         signed;
        private LocalDateTime   signedAt;
        private Long            signedByUserId;
        private String          ipAddress;

        // Visual signature
        private String          signatureData;

        // Cryptographic proof
        private String  cryptoPayload;
        private String  cryptoSignature;
        private String  cryptoPublicKey;
        private String  keyFingerprint;
        private boolean cryptoVerified;

        /**
         * 12-digit numeric signature code — uniquely identifies this signing event.
         * Formatted for display as: XXXX - XXXX - XXXX
         */
        private Long numericSignature;
    }

    // ── Verify response ────────────────────────────────────────────────────────
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class VerifyResponse {
        private Long          signatureId;
        private boolean       valid;
        private String        signerEmail;
        private String        signerRole;
        private LocalDateTime signedAt;
        private String        keyFingerprint;
        private String        message;
    }
}