package com.example.microservice_contract.service.impl;

import com.example.microservice_contract.dto.ContractSignatureDto;
import com.example.microservice_contract.entity.Contract;
import com.example.microservice_contract.entity.ContractSignature;
import com.example.microservice_contract.Enum.ContractStatus;
import com.example.microservice_contract.Enum.SignatureStatus;
import com.example.microservice_contract.repository.IContractRepository;
import com.example.microservice_contract.repository.IContractSignatureRepository;
import com.example.microservice_contract.service.AsyncEmailService;
import com.example.microservice_contract.service.CryptoSigningService;
import com.example.microservice_contract.service.IContractSignatureService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class ContractSignatureServiceImpl implements IContractSignatureService {

    private final IContractSignatureRepository signatureRepository;
    private final IContractRepository          contractRepository;
    private final AsyncEmailService            asyncEmailService;
    private final CryptoSigningService         cryptoSigningService;

    // ── Step 1: Initiate signature ─────────────────────────────────────────────

    @Override
    public ContractSignatureDto.Response initiateSignature(Long contractId,
                                                           ContractSignatureDto.CreateRequest request) {

        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new EntityNotFoundException("Contract not found: " + contractId));

        boolean alreadyPending = signatureRepository
                .existsByContractIdAndSignerIdAndStatus(contractId, request.getSignerId(), SignatureStatus.PENDING);
        if (alreadyPending) {
            throw new IllegalStateException(
                    "A pending signature already exists for signer " + request.getSignerId());
        }

        boolean alreadySigned = signatureRepository
                .existsByContractIdAndSignerIdAndStatus(contractId, request.getSignerId(), SignatureStatus.SIGNED);
        if (alreadySigned) {
            throw new IllegalStateException(
                    "Signer " + request.getSignerId() + " has already signed this contract");
        }

        ContractSignature signature = ContractSignature.builder()
                .contract(contract)
                .signerId(request.getSignerId())
                .signerRole(request.getSignerRole())
                .signerEmail(request.getSignerEmail())
                .signerName(request.getSignerName())
                .status(SignatureStatus.PENDING)
                .token(UUID.randomUUID().toString())
                .expiresAt(LocalDateTime.now().plusDays(7))
                .signed(false)
                .build();

        ContractSignature saved = signatureRepository.save(signature);

        log.info("Signature initiated for {} {} on contract {}",
                request.getSignerRole(), request.getSignerEmail(), contractId);

        asyncEmailService.sendSigningInvitation(
                request.getSignerEmail(),
                request.getSignerName(),
                contractId,
                request.getSignerRole(),
                saved.getToken()
        );

        return toResponse(saved, false);
    }

    // ── Step 2: Submit visual signature + generate cryptographic proof ─────────

    @Override
    public ContractSignatureDto.Response submitSignature(ContractSignatureDto.SignRequest request,
                                                         Long authenticatedUserId,
                                                         String authenticatedUserEmail,
                                                         String authenticatedUserRole) {

        if (request.getToken() == null || request.getToken().isBlank()) {
            throw new IllegalArgumentException("Token is required");
        }

        // ── 1. Load & validate the pending signature record ────────────────────

        ContractSignature signature = signatureRepository.findByToken(request.getToken())
                .orElseThrow(() -> new EntityNotFoundException("Invalid or expired token"));

        if (signature.getExpiresAt() != null &&
                LocalDateTime.now().isAfter(signature.getExpiresAt())) {
            throw new IllegalStateException("Signing link has expired");
        }

        if (signature.getStatus() == SignatureStatus.SIGNED) {
            throw new IllegalStateException("This contract has already been signed");
        }

        // ── 2. Validate authenticated user matches the invited signer ──────────

        if (!signature.getSignerEmail().equalsIgnoreCase(authenticatedUserEmail)) {
            log.warn("User {} attempted to sign for {} on contract {}",
                    authenticatedUserEmail, signature.getSignerEmail(),
                    signature.getContract().getId());
            throw new SecurityException(
                    "You are not authorized to sign this contract. " +
                            "Logged in as: " + authenticatedUserEmail +
                            ", but signature was requested for: " + signature.getSignerEmail());
        }

        if (!signature.getSignerRole().equalsIgnoreCase(authenticatedUserRole)) {
            log.warn("Role mismatch: user has role {} but signature requires {}",
                    authenticatedUserRole, signature.getSignerRole());
            throw new SecurityException(
                    "Role mismatch. You are logged in as " + authenticatedUserRole +
                            " but this signature requires role: " + signature.getSignerRole());
        }

        // ── 3. Strip data-URI prefix from the image payload ───────────────────

        String rawImageBase64 = request.getSignatureData();
        if (rawImageBase64.startsWith("data:image")) {
            rawImageBase64 = rawImageBase64.substring(rawImageBase64.indexOf(',') + 1);
        }

        // ── 4. Generate RSA-2048 key pair for this signing event ───────────────

        KeyPair keyPair;
        try {
            keyPair = cryptoSigningService.generateKeyPair();
        } catch (Exception e) {
            log.error("Key pair generation failed", e);
            throw new RuntimeException("Cryptographic signing unavailable", e);
        }

        LocalDateTime signedAt = LocalDateTime.now();

        // ── 5. Build canonical payload ─────────────────────────────────────────

        String payload = cryptoSigningService.buildSigningPayload(
                signature.getContract().getId(),
                authenticatedUserEmail,
                authenticatedUserRole,
                rawImageBase64,
                signedAt
        );

        // ── 6. Cryptographically sign the payload ──────────────────────────────

        String cryptoSig;
        String encodedPublicKey;
        String fingerprint;

        try {
            cryptoSig        = cryptoSigningService.sign(payload, keyPair.getPrivate());
            encodedPublicKey = cryptoSigningService.encodePublicKey(keyPair.getPublic());
            fingerprint      = computeKeyFingerprint(keyPair.getPublic().getEncoded());
        } catch (Exception e) {
            log.error("Signing failed", e);
            throw new RuntimeException("Failed to generate cryptographic signature", e);
        }

        // ── 7. Self-verify before persisting (integrity gate) ─────────────────

        boolean verified = cryptoSigningService.verify(payload, cryptoSig, encodedPublicKey);
        if (!verified) {
            throw new RuntimeException("Cryptographic self-verification failed — signature NOT saved");
        }

        // ── 8. Generate numeric signature ──────────────────────────────────────

        Long numericSig = generateNumericSignature(
                signature.getContract().getId(),
                authenticatedUserId,
                signedAt
        );

        // ── 9. Persist everything ──────────────────────────────────────────────

        signature.setSignatureData(rawImageBase64);
        signature.setIpAddress(request.getIpAddress());
        signature.setStatus(SignatureStatus.SIGNED);
        signature.setSignedAt(signedAt);
        signature.setSigned(true);
        signature.setSignedByUserId(authenticatedUserId);

        // Cryptographic fields
        signature.setCryptoPayload(payload);
        signature.setCryptoSignature(cryptoSig);
        signature.setCryptoPublicKey(encodedPublicKey);
        signature.setKeyFingerprint(fingerprint);

        // Numeric signature
        signature.setNumericSignature(numericSig);

        ContractSignature saved = signatureRepository.save(signature);

        log.info("Contract {} signed by {} ({}) — key fingerprint: {} — numeric: {}",
                signature.getContract().getId(), authenticatedUserEmail,
                authenticatedUserRole, fingerprint, numericSig);

        // ── 10. Activate contract if both parties have signed ──────────────────

        checkAndActivateContract(signature.getContract());

        return toResponse(saved, true);
    }

    // ── Verify stored cryptographic signature ──────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public ContractSignatureDto.VerifyResponse verifySignature(Long signatureId) {

        ContractSignature sig = findOrThrow(signatureId);

        if (sig.getCryptoSignature() == null || sig.getCryptoPublicKey() == null) {
            return ContractSignatureDto.VerifyResponse.builder()
                    .signatureId(signatureId)
                    .valid(false)
                    .message("No cryptographic signature stored for this record")
                    .build();
        }

        boolean valid = cryptoSigningService.verify(
                sig.getCryptoPayload(),
                sig.getCryptoSignature(),
                sig.getCryptoPublicKey()
        );

        log.info("Verification of signature {} → {}", signatureId, valid ? "VALID" : "INVALID");

        return ContractSignatureDto.VerifyResponse.builder()
                .signatureId(signatureId)
                .valid(valid)
                .signerEmail(sig.getSignerEmail())
                .signerRole(sig.getSignerRole())
                .signedAt(sig.getSignedAt())
                .keyFingerprint(sig.getKeyFingerprint())
                .message(valid
                        ? "Signature is cryptographically valid"
                        : "WARNING: Signature verification FAILED — record may have been tampered with")
                .build();
    }

    // ── canUserSign ────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public boolean canUserSign(Long contractId, String token, Long userId, String userRole) {
        ContractSignature sig = signatureRepository.findByToken(token).orElse(null);
        if (sig == null)                                              return false;
        if (!sig.getContract().getId().equals(contractId))           return false;
        if (sig.getStatus() == SignatureStatus.SIGNED)               return false;
        if (sig.getExpiresAt() != null &&
                LocalDateTime.now().isAfter(sig.getExpiresAt()))     return false;
        return sig.getSignerRole().equalsIgnoreCase(userRole);
    }

    // ── Read ───────────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public ContractSignatureDto.Response getSignatureById(Long id) {
        ContractSignature sig = findOrThrow(id);
        boolean verified = false;
        if (sig.getCryptoSignature() != null && sig.getCryptoPublicKey() != null) {
            verified = cryptoSigningService.verify(
                    sig.getCryptoPayload(), sig.getCryptoSignature(), sig.getCryptoPublicKey());
        }
        return toResponse(sig, verified);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ContractSignatureDto.Response> getSignaturesByContract(Long contractId) {
        return signatureRepository.findByContractId(contractId)
                .stream()
                .map(sig -> {
                    boolean verified = false;
                    if (sig.getCryptoSignature() != null && sig.getCryptoPublicKey() != null) {
                        verified = cryptoSigningService.verify(
                                sig.getCryptoPayload(), sig.getCryptoSignature(), sig.getCryptoPublicKey());
                    }
                    return toResponse(sig, verified);
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isFullySigned(Long contractId) {
        return signatureRepository.countByContractIdAndStatus(contractId, SignatureStatus.SIGNED) >= 2;
    }

    // ── Auto-activate ──────────────────────────────────────────────────────────

    private void checkAndActivateContract(Contract contract) {
        long signedCount = signatureRepository
                .countByContractIdAndStatus(contract.getId(), SignatureStatus.SIGNED);

        if (signedCount >= 2 && contract.getStatus() == ContractStatus.PENDING) {
            contract.setStatus(ContractStatus.ACTIVE);
            contractRepository.save(contract);

            log.info("Contract {} is now ACTIVE — both parties have signed", contract.getId());

            signatureRepository.findByContractId(contract.getId())
                    .forEach(s -> asyncEmailService.sendContractActivated(
                            s.getSignerEmail(), s.getSignerName(), contract.getId()));
        }
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private ContractSignature findOrThrow(Long id) {
        return signatureRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "ContractSignature not found: " + id));
    }

    /**
     * Generates a deterministic 12-digit numeric signature code.
     * Input: contractId + signerId + signedAt → SHA-256 → first 8 bytes → positive long → 12 digits.
     */
    private Long generateNumericSignature(Long contractId, Long signerId, LocalDateTime signedAt) {
        try {
            String raw = contractId + "|" + signerId + "|" + signedAt.toString();
            byte[] hash = MessageDigest.getInstance("SHA-256")
                    .digest(raw.getBytes(StandardCharsets.UTF_8));

            // Take first 8 bytes and build a positive long
            long value = 0;
            for (int i = 0; i < 8; i++) {
                value = (value << 8) | (hash[i] & 0xFF);
            }
            value = Math.abs(value) % 1_000_000_000_000L; // cap to 12 digits

            // Ensure it is always exactly 12 digits (pad if < 100_000_000_000)
            if (value < 100_000_000_000L) {
                value += 100_000_000_000L;
            }
            return value;

        } catch (Exception e) {
            log.warn("Numeric signature generation failed, using timestamp fallback", e);
            long fallback = Math.abs(System.currentTimeMillis() % 900_000_000_000L)
                    + 100_000_000_000L;
            return fallback;
        }
    }

    /**
     * SHA-256 fingerprint of the raw public-key bytes, formatted as hex.
     */
    private String computeKeyFingerprint(byte[] publicKeyBytes) {
        try {
            byte[] hash = MessageDigest.getInstance("SHA-256").digest(publicKeyBytes);
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            return "unknown";
        }
    }

    private ContractSignatureDto.Response toResponse(ContractSignature s, boolean cryptoVerified) {
        return ContractSignatureDto.Response.builder()
                .id(s.getId())
                .contractId(s.getContract().getId())
                .signerId(s.getSignerId())
                .signerRole(s.getSignerRole())
                .signerEmail(s.getSignerEmail())
                .signerName(s.getSignerName())
                .status(s.getStatus())
                .token(s.getToken())
                .expiresAt(s.getExpiresAt())
                .createdAt(s.getCreatedAt())
                .signed(s.isSigned())
                .signedAt(s.getSignedAt())
                .signedByUserId(s.getSignedByUserId())
                .ipAddress(s.getIpAddress())
                // Visual
                .signatureData(s.getSignatureData())
                // Cryptographic proof
                .cryptoPayload(s.getCryptoPayload())
                .cryptoSignature(s.getCryptoSignature())
                .cryptoPublicKey(s.getCryptoPublicKey())
                .keyFingerprint(s.getKeyFingerprint())
                .cryptoVerified(cryptoVerified)
                // Numeric
                .numericSignature(s.getNumericSignature())
                .build();
    }
}