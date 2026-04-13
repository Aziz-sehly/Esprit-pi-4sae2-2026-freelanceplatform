package com.example.microservice_contract.service;

import com.example.microservice_contract.dto.ContractSignatureDto;

import java.util.List;

public interface IContractSignatureService {

    /**
     * Step 1 — Initiate a signature request for one party.
     * Creates a unique token, saves a PENDING signature record,
     * and sends the signing link to the signer's email via Resend.
     */
    ContractSignatureDto.Response initiateSignature(Long contractId,
                                                    ContractSignatureDto.CreateRequest request);

    /**
     * Step 2 — Submit the actual drawn/uploaded signature with user authentication.
     * Validates the token, verifies the authenticated user matches the signature request,
     * saves the base64 image, generates RSA-SHA256 cryptographic proof,
     * marks the record as SIGNED, and checks if both parties have signed.
     * If both signed → contract status becomes ACTIVE and activation emails are sent.
     *
     * @param request                the submission request (token + base64 image)
     * @param authenticatedUserId    ID of the currently logged-in user (from JWT)
     * @param authenticatedUserEmail email of the currently logged-in user (from JWT)
     * @param authenticatedUserRole  role of the currently logged-in user (from JWT)
     * @return the updated signature response including cryptographic proof fields
     * @throws SecurityException     if authenticated user doesn't match signature request
     * @throws IllegalStateException if token expired or already signed
     */
    ContractSignatureDto.Response submitSignature(ContractSignatureDto.SignRequest request,
                                                  Long authenticatedUserId,
                                                  String authenticatedUserEmail,
                                                  String authenticatedUserRole);

    /**
     * Re-run RSA verification on a stored signature record.
     * Returns valid=true if cryptoSignature, cryptoPayload, and cryptoPublicKey
     * are consistent — proves the record has not been tampered with.
     */
    ContractSignatureDto.VerifyResponse verifySignature(Long signatureId);

    ContractSignatureDto.Response getSignatureById(Long id);

    List<ContractSignatureDto.Response> getSignaturesByContract(Long contractId);

    boolean isFullySigned(Long contractId);

    /**
     * Check if a specific user is authorized to sign a contract with the given token.
     * Validates: token exists, not expired, not already signed, user role matches.
     */
    boolean canUserSign(Long contractId, String token, Long userId, String userRole);
}