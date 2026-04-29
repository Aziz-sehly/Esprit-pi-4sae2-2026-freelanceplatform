package com.esprit.microservice_project.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ProjectStatsDTO {

    // Stats globales
    private long totalProjects;
    private long openProjects;
    private long inProgressProjects;
    private long completedProjects;
    private long cancelledProjects;
    private long archivedProjects;

    // Budget
    private double averageBudgetMin;
    private double averageBudgetMax;
    private double averageBudget;       // moyenne de (min+max)/2
    private double totalBudgetMax;

    // Popularité
    private List<PopularProject> mostPopularProjects;  // les plus proposés
    private List<String> topCategories;                // catégories les plus demandées
    private List<String> topSkills;                    // skills les plus demandés

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class PopularProject {
        private int id;
        private String title;
        private String category;
        private float budgetMin;
        private float budgetMax;
        private String status;
        private long proposalsCount;
    }
}