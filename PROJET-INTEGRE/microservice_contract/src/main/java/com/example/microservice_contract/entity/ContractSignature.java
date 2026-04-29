package com.example.microservice_contract.entity;

import com.example.microservice_contract.Enum.SignatureStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "contract_signatures")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContractSignature {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contract_id", nullable = false)
    private Contract contract;

    @Column(name = "signer_id", nullable = false)
    private Long signerId;

    @Column(name = "signer_role", nullable = false)
    private String signerRole;

    @Column(name = "signer_email", nullable = false)
    private String signerEmail;

    @Column(name = "signer_name", nullable = false)
    private String signerName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private SignatureStatus status = SignatureStatus.PENDING;

    @Column(name = "token", unique = true, nullable = false)
    private String token;

    @Column(name = "signature_data", columnDefinition = "LONGTEXT")
    private String signatureData;

    @Column(name = "crypto_payload", columnDefinition = "TEXT")
    private String cryptoPayload;

    @Column(name = "crypto_signature", columnDefinition = "TEXT")
    private String cryptoSignature;

    @Column(name = "crypto_public_key", columnDefinition = "TEXT")
    private String cryptoPublicKey;

    @Column(name = "key_fingerprint", length = 64)
    private String keyFingerprint;

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(name = "signed_at")
    private LocalDateTime signedAt;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(nullable = false)
    @Builder.Default
    private boolean signed = false;

    @Column(name = "signed_by_user_id")
    private Long signedByUserId;

    /**
     * Human-readable 12-digit numeric signature code.
     * Generated deterministically at signing time from contractId + signerId + signedAt.
     * Uniquely identifies this signing event for legal correspondence and audit trails.
     */
    @Column(name = "numeric_signature", length = 20)
    private Long numericSignature;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}