package com.esprit.microservice_project.Services;

import com.esprit.microservice_project.DTO.ProjectStatsDTO;
import com.esprit.microservice_project.Entity.Experience;
import com.esprit.microservice_project.Entity.Project;
import com.esprit.microservice_project.Entity.Status;

import java.util.List;

public interface IServiceProject {
    Project addProject(Project project);
    Project updateProject(int id, Project newProject);
    List<Project> getProjects();
    Project getProject(int id);
    void deleteProject(int id);
    List<Project> getProjectsByClientId(int clientId);
    List<Project> search(String query, String category,
                         Status status, Experience experience,
                         Float budgetMin, Float budgetMax);
    List<Project> filter(String category, Status status, Experience experience,
                         Float budgetMin, Float budgetMax);

    ProjectStatsDTO getClientStats(int clientId);
    ProjectStatsDTO getFreelancerStats();
    // ADD à la fin de l'interface, avant la dernière accolade

    Project getProjectById(int id);
}
