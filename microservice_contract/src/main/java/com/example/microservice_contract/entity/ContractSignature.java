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

    // CLIENT or FREELANCER
    @Column(name = "signer_role", nullable = false)
    private String signerRole;

    // Email used to send the signing link
    @Column(name = "signer_email", nullable = false)
    private String signerEmail;

    // Display name used in email greeting
    @Column(name = "signer_name", nullable = false)
    private String signerName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private SignatureStatus status = SignatureStatus.PENDING;

    // Unique token embedded in the signing link
    @Column(name = "token", unique = true, nullable = false)
    private String token;

    // Base64-encoded PNG drawn by the signer
    @Column(name = "signature_data", columnDefinition = "LONGTEXT")
    private String signatureData;

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(name = "signed_at")
    private LocalDateTime signedAt;

    // Token expiry — default 7 days from creation
    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    // ADD THIS FIELD - matches the database column
    @Column(nullable = false)
    @Builder.Default
    private boolean signed = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}