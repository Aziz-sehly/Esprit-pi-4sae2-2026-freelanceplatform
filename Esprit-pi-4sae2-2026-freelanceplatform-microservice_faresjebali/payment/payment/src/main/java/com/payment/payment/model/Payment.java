package com.payment.payment.model;


import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // External references
    @Column(nullable = false)
    private Long contractId;

    private Long milestoneId;

    @Column(nullable = false)
    private Long payerId;

    @Column(nullable = false)
    private Long payeeId;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(precision = 12, scale = 2)
    private BigDecimal platformFee;

    @Column(precision = 12, scale = 2)
    private BigDecimal netAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentMethod method;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus status;

    private String provider;     // ex: "STRIPE"
    private String providerRef;  // ex: paymentIntentId
    private String stripePaymentIntentId;
    private String stripeCheckoutSessionId;
    private String webhookEventId;
    private String currency;
    private String refundReason;

    @Column(nullable = false)
    private LocalDateTime createdAt;
    private LocalDateTime releasedAt;
    private LocalDateTime refundedAt;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) status = PaymentStatus.PENDING;
        if (platformFee == null) platformFee = BigDecimal.ZERO;
        if (netAmount == null && amount != null) netAmount = amount.subtract(platformFee == null ? BigDecimal.ZERO : platformFee);
        if (provider == null) provider = "MANUAL";
        if (currency == null) currency = "usd";
    }
}
