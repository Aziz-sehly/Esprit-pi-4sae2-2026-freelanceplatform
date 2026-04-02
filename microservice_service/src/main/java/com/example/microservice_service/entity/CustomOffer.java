package com.example.microservice_service.entity;

import com.example.microservice_service.entity.enums.CustomOfferStatus;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "custom_offers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomOffer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long senderId;

    @Column(nullable = false)
    private Long receiverId;

    // Optional — can be a standalone offer without a service
    @JsonIgnoreProperties({"addOns", "shop", "hibernateLazyInitializer", "handler"})
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_id")
    private FreelancerService service;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal offerPrice;

    @Column(nullable = false)
    private Integer deliveryDays;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CustomOfferStatus status;

    private Long chatThreadId;

    private LocalDateTime expiresAt;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) status = CustomOfferStatus.PENDING;
        if (expiresAt == null) expiresAt = createdAt.plusDays(7);
    }
}