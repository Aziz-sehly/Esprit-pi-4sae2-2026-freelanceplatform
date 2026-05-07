package com.example.microservice_service.entity;

import com.example.microservice_service.entity.enums.OrderStatus;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long buyerId;

    @Column(nullable = false)
    private Long sellerId;

    @JsonIgnoreProperties({"addOns", "shop", "hibernateLazyInitializer", "handler"})
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_id", nullable = false)
    private FreelancerService service;

    @Column(columnDefinition = "TEXT")
    private String selectedAddOns;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal totalPrice;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status;

    @Column(columnDefinition = "TEXT")
    private String buyerRequirementsAnswer;

    @Column(columnDefinition = "TEXT")
    private String deliveryMessage;

    @Column(columnDefinition = "TEXT")
    private String deliveryFileUrls;

    @Column(nullable = false)
    private Integer revisionsUsed;

    @Column(columnDefinition = "TEXT")
    private String revisionNotes;

    private Long chatThreadId;

    private LocalDateTime deadline;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime completedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) status = OrderStatus.PENDING_REQUIREMENTS;
        if (revisionsUsed == null) revisionsUsed = 0;
    }
}