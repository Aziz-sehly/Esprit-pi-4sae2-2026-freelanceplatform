package com.esprit.microservice_project.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ProposalNotificationDTO {
    private int    projectId;
    private double proposedBudget;
    private int    deliveryDays;
    private String coverLetter;
}