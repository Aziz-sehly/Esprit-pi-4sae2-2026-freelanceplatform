package com.example.microservice_contract.entity;

import com.example.microservice_contract.Enum.ContractStatus;
import com.example.microservice_contract.Enum.PaymentStructure;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "contracts")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Contract {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "client_id")
    private Long clientId;

    @Column(name = "freelancer_id")
    private Long freelancerId;

    @Column(name = "project_id")
    private Long projectId;

    @Column(name = "proposal_id")
    private Long proposalId;

    @Column(precision = 38, scale = 2)
    private BigDecimal amount;

    @Column(name = "amount_paid", precision = 38, scale = 2)
    private BigDecimal amountPaid;

    @Column(name = "platform_fee_percentage", precision = 38, scale = 2)
    private BigDecimal platformFeePercentage;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_structure", length = 20)
    private PaymentStructure paymentStructure;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    @Builder.Default
    private ContractStatus status = ContractStatus.ACTIVE;

    @Column(name = "start_date")
    private LocalDateTime startDate;

    @Column(name = "end_date")
    private LocalDateTime endDate;

    // FK references to other microservices — stored as plain IDs
    @Column(name = "dispute_id")
    private Long disputeId;

    @Column(name = "milestone_id")
    private Long milestoneId;

    @Column(name = "transaction_id")
    private Long transactionId;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "contract", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ContractExtension> extensions = new ArrayList<>();

    @OneToMany(mappedBy = "contract", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ContractSignature> signatures = new ArrayList<>();
}