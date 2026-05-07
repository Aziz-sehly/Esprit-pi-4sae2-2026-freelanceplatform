// Proposal.java
package com.esprit.microservice_proposal.Entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "proposals")
public class Proposal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "project_id", nullable = false)
    private Integer projectId;

    @Column(name = "freelancer_id", nullable = false)
    private Integer freelancerId;

    private Float proposedPrice;
    private Integer deliveryDays;

    @Column(columnDefinition = "TEXT")
    private String coverLetter;

    @Enumerated(EnumType.STRING)
    private ProposalStatus status;

    private Boolean isInvited = false;
    private Integer revisionsOffered = 0;

    // ✅ NEW: Payment Structure
    @Enumerated(EnumType.STRING)
    @Column(name = "payment_structure", nullable = false)
    private PaymentStructure paymentStructure = PaymentStructure.FIXED;

    // For HOURLY projects
    @Column(name = "hourly_rate")
    private Float hourlyRate;

    @Column(name = "estimated_hours_per_week")
    private Integer estimatedHoursPerWeek;

    // For MILESTONE projects
    @Column(name = "milestone_count")
    private Integer milestoneCount;

    @Column(name = "milestone_details", columnDefinition = "TEXT")
    private String milestoneDetails; // JSON string of milestones

    // Expiration
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;

    // Counter-Offer
    private Float counterOfferPrice;
    private String counterOfferMessage;
    private LocalDateTime counterOfferAt;

    // Smart Ranking score
    @Column(name = "ranking_score")
    private Double rankingScore;
}