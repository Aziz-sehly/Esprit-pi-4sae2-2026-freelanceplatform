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
     * Step 2 — Submit the actual drawn signature.
     * Validates the token, saves the base64 signature image,
     * marks the record as SIGNED, and checks if both parties have signed.
     * If both signed → contract status becomes ACTIVE and activation emails are sent.
     */
    ContractSignatureDto.Response submitSignature(ContractSignatureDto.SignRequest request);

    ContractSignatureDto.Response getSignatureById(Long id);

    List<ContractSignatureDto.Response> getSignaturesByContract(Long contractId);

    boolean isFullySigned(Long contractId);
}