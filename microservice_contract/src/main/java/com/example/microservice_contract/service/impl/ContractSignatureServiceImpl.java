package com.example.microservice_contract.service.impl;

import com.example.microservice_contract.dto.ContractSignatureDto;
import com.example.microservice_contract.entity.Contract;
import com.example.microservice_contract.entity.ContractSignature;
import com.example.microservice_contract.Enum.ContractStatus;
import com.example.microservice_contract.Enum.SignatureStatus;
import com.example.microservice_contract.repository.IContractRepository;
import com.example.microservice_contract.repository.IContractSignatureRepository;
import com.example.microservice_contract.service.EmailService;
import com.example.microservice_contract.service.IContractSignatureService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class ContractSignatureServiceImpl implements IContractSignatureService {

    private final IContractSignatureRepository signatureRepository;
    private final IContractRepository          contractRepository;
    private final EmailService                 emailService;

    // ── Step 1: Initiate signature ─────────────────────────────────────────────

    @Override
    public ContractSignatureDto.Response initiateSignature(Long contractId,
                                                           ContractSignatureDto.CreateRequest request) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new EntityNotFoundException("Contract not found: " + contractId));

        // Prevent duplicate signing requests for the same signer
        boolean alreadyExists = signatureRepository
                .existsByContractIdAndSignerIdAndStatus(contractId, request.getSignerId(), SignatureStatus.PENDING);
        if (alreadyExists) {
            throw new IllegalStateException(
                    "A pending signature already exists for signer " + request.getSignerId());
        }

        boolean alreadySigned = signatureRepository
                .existsByContractIdAndSignerIdAndStatus(contractId, request.getSignerId(), SignatureStatus.SIGNED);
        if (alreadySigned) {
            throw new IllegalStateException(
                    "Signer " + request.getSignerId() + " has already signed this contract");
        }

        // Generate a unique, secure token for this signing session
        String token = UUID.randomUUID().toString();

        ContractSignature signature = ContractSignature.builder()
                .contract(contract)
                .signerId(request.getSignerId())
                .signerRole(request.getSignerRole())
                .signerEmail(request.getSignerEmail())
                .signerName(request.getSignerName())
                .status(SignatureStatus.PENDING)
                .token(token)
                .expiresAt(LocalDateTime.now().plusDays(7))
                .signed(false)
                .build();

        ContractSignature saved = signatureRepository.save(signature);

        log.info("Signature initiated for {} {} on contract {}",
                request.getSignerRole(), request.getSignerEmail(), contractId);

        // FIX: Send email asynchronously to avoid transaction rollback
        sendEmailAsync(request.getSignerEmail(), request.getSignerName(),
                contractId, request.getSignerRole(), token);

        return toResponse(saved);
    }

    // New method to send email asynchronously
    private void sendEmailAsync(String toEmail, String recipientName,
                                Long contractId, String signerRole, String token) {
        CompletableFuture.runAsync(() -> {
            try {
                emailService.sendSigningInvitation(toEmail, recipientName, contractId, signerRole, token);
                log.info("Async email sent to: {}", toEmail);
            } catch (Exception e) {
                log.error("Async email failed for {}: {}", toEmail, e.getMessage(), e);
                // Email failure doesn't affect contract creation
            }
        });
    }

    // ── Step 2: Submit drawn signature ─────────────────────────────────────────

    @Override
    public ContractSignatureDto.Response submitSignature(ContractSignatureDto.SignRequest request) {

        if (request.getToken() == null || request.getToken().isEmpty()) {
            throw new IllegalArgumentException("Token is required");
        }

        ContractSignature signature = signatureRepository.findByToken(request.getToken())
                .orElseThrow(() -> new EntityNotFoundException("Invalid or expired token"));

        if (signature.getExpiresAt() != null &&
                LocalDateTime.now().isAfter(signature.getExpiresAt())) {
            throw new IllegalStateException("Token expired");
        }

        if (signature.getStatus() == SignatureStatus.SIGNED) {
            throw new IllegalStateException("Already signed");
        }

        // 🔥 FIX BASE64
        String data = request.getSignatureData();
        if (data.startsWith("data:image")) {
            data = data.substring(data.indexOf(",") + 1);
        }

        signature.setSignatureData(data);
        signature.setIpAddress(request.getIpAddress());
        signature.setStatus(SignatureStatus.SIGNED);
        signature.setSignedAt(LocalDateTime.now());
        signature.setSigned(true);

        ContractSignature saved = signatureRepository.save(signature);

        checkAndActivateContract(signature.getContract());

        return toResponse(saved);
    }


    // ── Read methods ───────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public ContractSignatureDto.Response getSignatureById(Long id) {
        return toResponse(findOrThrow(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ContractSignatureDto.Response> getSignaturesByContract(Long contractId) {
        return signatureRepository.findByContractId(contractId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isFullySigned(Long contractId) {
        // Requires exactly 2 SIGNED signatures: CLIENT + FREELANCER
        return signatureRepository.countByContractIdAndStatus(contractId, SignatureStatus.SIGNED) >= 2;
    }

    // ── Auto-activate contract when both parties have signed ───────────────────

    private void checkAndActivateContract(Contract contract) {
        long signedCount = signatureRepository
                .countByContractIdAndStatus(contract.getId(), SignatureStatus.SIGNED);

        if (signedCount >= 2 && contract.getStatus() == ContractStatus.PENDING) {

            // Activate the contract
            contract.setStatus(ContractStatus.ACTIVE);
            contractRepository.save(contract);

            log.info("Contract {} is now ACTIVE — both parties have signed", contract.getId());

            // Send activation confirmation emails asynchronously
            List<ContractSignature> signatures = signatureRepository
                    .findByContractId(contract.getId());

            for (ContractSignature s : signatures) {
                sendActivationEmailAsync(s.getSignerEmail(), s.getSignerName(), contract.getId());
            }
        }
    }

    // Send activation email asynchronously
    private void sendActivationEmailAsync(String toEmail, String recipientName, Long contractId) {
        CompletableFuture.runAsync(() -> {
            try {
                emailService.sendContractActivatedEmail(toEmail, recipientName, contractId);
                log.info("Async activation email sent to: {}", toEmail);
            } catch (Exception e) {
                log.error("Async activation email failed for {}: {}", toEmail, e.getMessage(), e);
            }
        });
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private ContractSignature findOrThrow(Long id) {
        return signatureRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "ContractSignature not found: " + id));
    }

    private ContractSignatureDto.Response toResponse(ContractSignature s) {
        return ContractSignatureDto.Response.builder()
                .id(s.getId())
                .contractId(s.getContract().getId())
                .signerId(s.getSignerId())
                .signerRole(s.getSignerRole())
                .signerEmail(s.getSignerEmail())
                .signerName(s.getSignerName())
                .status(s.getStatus())
                .signatureData(s.getSignatureData())
                .token(s.getToken())
                .ipAddress(s.getIpAddress())
                .signedAt(s.getSignedAt())
                .expiresAt(s.getExpiresAt())
                .createdAt(s.getCreatedAt())
                .build();
    }
}