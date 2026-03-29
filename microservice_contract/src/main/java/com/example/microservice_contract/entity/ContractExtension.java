package com.example.microservice_contract.entity;

import com.example.microservice_contract.Enum.ExtensionStatus;
import com.example.microservice_contract.Enum.ExtensionType;
import com.example.microservice_contract.Enum.RequestingParty;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "contract_extensions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ContractExtension {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contract_id", nullable = false)
    private Contract contract;

    @Column(name = "additional_days", nullable = false)
    private Integer additionalDays;

    @Enumerated(EnumType.STRING)
    @Column(name = "extension_type", nullable = false)
    private ExtensionType extensionType;

    @Column(name = "proposed_amount", precision = 38, scale = 2)
    private BigDecimal proposedAmount;

    @Column(name = "requested_at")
    private LocalDateTime requestedAt;

    @Column(name = "requester_note", length = 1000)
    private String requesterNote;

    @Enumerated(EnumType.STRING)
    @Column(name = "requesting_party", nullable = false)
    private RequestingParty requestingParty;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @Column(name = "responder_note", length = 1000)
    private String responderNote;

    @Column(name = "risk_alerts")
    private String riskAlerts;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private ExtensionStatus status = ExtensionStatus.PENDING;

    @Column(name = "suggested_amount", precision = 38, scale = 2)
    private BigDecimal suggestedAmount;
}