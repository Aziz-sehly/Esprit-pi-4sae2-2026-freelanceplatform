package com.esprit.microservice_project.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ProjectAISuggestResponse {
    private String title;
    private String skills;
    private String category;   // ← AJOUTER
    private Float  budgetMin;
    private Float  budgetMax;
}