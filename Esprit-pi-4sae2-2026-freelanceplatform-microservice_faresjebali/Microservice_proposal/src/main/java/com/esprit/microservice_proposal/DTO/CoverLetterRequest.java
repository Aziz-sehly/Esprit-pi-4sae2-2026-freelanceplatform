package com.esprit.microservice_proposal.DTO;

import lombok.Data;

@Data
public class CoverLetterRequest {
    private String freelancerSkills;
    private String projectTitle;
    private String projectDescription;
    private String projectCategory;
    private Float  projectBudgetMin;
    private Float  projectBudgetMax;
    private String projectDuration;
}