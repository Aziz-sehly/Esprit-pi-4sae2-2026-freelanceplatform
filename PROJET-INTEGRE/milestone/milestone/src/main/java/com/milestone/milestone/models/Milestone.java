package com.milestone.milestone.models;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Milestone {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;


    private Long contractId;

    private String title;

    @Column(length = 2000)
    private String deliverable;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    private LocalDate dueDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MilestoneStatus status;

    @Column(nullable = false)
    private Integer revisionCount;

    @Column(length = 2000)
    private String lastFeedback;

    private Long approvedBy;
    private Long submittedBy;

    private LocalDateTime clientApprovedAt;
    private LocalDateTime fundedAt;
    private LocalDateTime paidAt;
    private LocalDateTime submittedAt;
    private LocalDateTime statusUpdatedAt;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        statusUpdatedAt = now;
        if (revisionCount == null) revisionCount = 0;
        if (status == null) status = MilestoneStatus.PENDING;
    }
}
