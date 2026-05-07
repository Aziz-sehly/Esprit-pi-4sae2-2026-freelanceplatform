package com.example.microservice_contract.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.*;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.time.LocalDateTime;
import java.util.Base64;

/**
 * Handles RSA-based cryptographic signing of contracts.
 *
 * Flow:
 *  1. On first startup (or per-contract), generate an RSA key pair.
 *  2. Build a canonical "signing payload" from contract data + signer identity + timestamp.
 *  3. Sign the payload with the private key → store the signature bytes (base64).
 *  4. Store the public key alongside the record so anyone can verify later.
 *
 * The visual signature image is kept separately for display purposes.
 */
@Service
@Slf4j
public class CryptoSigningService {

    private static final String ALGORITHM     = "RSA";
    private static final String SIGN_ALGO     = "SHA256withRSA";
    private static final int    KEY_SIZE       = 2048;

    // ── Key-pair generation ────────────────────────────────────────────────────

    /**
     * Generate a fresh RSA-2048 key pair.
     * In production you would load a long-lived server key from a KeyStore / HSM.
     * For per-signature non-repudiation (each signer gets their own key pair)
     * call this once per signing event.
     */
    public KeyPair generateKeyPair() throws NoSuchAlgorithmException {
        KeyPairGenerator gen = KeyPairGenerator.getInstance(ALGORITHM);
        gen.initialize(KEY_SIZE, new SecureRandom());
        return gen.generateKeyPair();
    }

    // ── Canonical payload ──────────────────────────────────────────────────────

    /**
     * Build a deterministic string that uniquely represents this signing event.
     * Anything that must be tamper-evident goes here.
     *
     * Format: CONTRACT:<id>|SIGNER:<email>|ROLE:<role>|TIMESTAMP:<iso>|HASH:<contentHash>
     */
    public String buildSigningPayload(Long contractId,
                                      String signerEmail,
                                      String signerRole,
                                      String signatureImageBase64,
                                      LocalDateTime signedAt) {

        // Hash the raw image bytes so the payload is a fixed length
        String imageHash = sha256Hex(signatureImageBase64);

        return "CONTRACT:" + contractId
                + "|SIGNER:"    + signerEmail
                + "|ROLE:"      + signerRole
                + "|TIMESTAMP:" + signedAt.toString()
                + "|IMAGEHASH:" + imageHash;
    }

    // ── Sign ───────────────────────────────────────────────────────────────────

    /**
     * Sign {@code payload} with {@code privateKey}.
     *
     * @return Base64-encoded RSA signature bytes.
     */
    public String sign(String payload, PrivateKey privateKey) throws GeneralSecurityException {
        Signature signer = Signature.getInstance(SIGN_ALGO);
        signer.initSign(privateKey);
        signer.update(payload.getBytes(StandardCharsets.UTF_8));
        byte[] signatureBytes = signer.sign();
        return Base64.getEncoder().encodeToString(signatureBytes);
    }

    // ── Verify ─────────────────────────────────────────────────────────────────

    /**
     * Verify a previously stored signature.
     *
     * @param payload          The same canonical payload that was signed.
     * @param base64Signature  The stored Base64 RSA signature.
     * @param base64PublicKey  The stored Base64 public key (X.509 / SubjectPublicKeyInfo).
     * @return true if the signature is valid.
     */
    public boolean verify(String payload,
                          String base64Signature,
                          String base64PublicKey) {
        try {
            PublicKey publicKey = decodePublicKey(base64PublicKey);

            Signature verifier = Signature.getInstance(SIGN_ALGO);
            verifier.initVerify(publicKey);
            verifier.update(payload.getBytes(StandardCharsets.UTF_8));

            byte[] sigBytes = Base64.getDecoder().decode(base64Signature);
            return verifier.verify(sigBytes);

        } catch (Exception e) {
            log.error("Signature verification failed", e);
            return false;
        }
    }

    // ── Key encoding helpers ───────────────────────────────────────────────────

    /** Encode a public key to Base64 (X.509 SubjectPublicKeyInfo). */
    public String encodePublicKey(PublicKey key) {
        return Base64.getEncoder().encodeToString(key.getEncoded());
    }

    /** Encode a private key to Base64 (PKCS#8). */
    public String encodePrivateKey(PrivateKey key) {
        return Base64.getEncoder().encodeToString(key.getEncoded());
    }

    /** Decode a Base64 public key back to a {@link PublicKey}. */
    public PublicKey decodePublicKey(String base64) throws GeneralSecurityException {
        byte[] bytes = Base64.getDecoder().decode(base64);
        KeyFactory kf = KeyFactory.getInstance(ALGORITHM);
        return kf.generatePublic(new X509EncodedKeySpec(bytes));
    }

    /** Decode a Base64 private key back to a {@link PrivateKey}. */
    public PrivateKey decodePrivateKey(String base64) throws GeneralSecurityException {
        byte[] bytes = Base64.getDecoder().decode(base64);
        KeyFactory kf = KeyFactory.getInstance(ALGORITHM);
        return kf.generatePrivate(new PKCS8EncodedKeySpec(bytes));
    }

    // ── Internal helpers ───────────────────────────────────────────────────────

    private String sha256Hex(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(input.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }
}