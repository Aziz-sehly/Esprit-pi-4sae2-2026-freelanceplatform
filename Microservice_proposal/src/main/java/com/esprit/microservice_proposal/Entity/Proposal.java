package com.esprit.microservice_proposal.Entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class Proposal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    // Simple INT → pas de @ManyToOne
    @Column(name = "project_id", nullable = false)
    private Integer projectId;

    // Simple INT → pas de @ManyToOne
    @Column(name = "freelancer_id", nullable = false)
    private Integer freelancerId;

    private Float proposedPrice;
    private Integer deliveryDays;

    @Column(columnDefinition = "TEXT")
    private String coverLetter;

    @Enumerated(EnumType.STRING)
    private ProposalStatus status;

    private Boolean isInvited;
    private Integer revisionsOffered;
}