package com.esprit.microservice_project.Services;

import com.esprit.microservice_project.DTO.ProjectStatsDTO;
import com.esprit.microservice_project.Entity.Experience;
import com.esprit.microservice_project.Entity.Project;
import com.esprit.microservice_project.Entity.Status;
import com.esprit.microservice_project.Repository.ProjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ServiceProject implements IServiceProject {

    @Autowired
    private ProjectRepository projectRepository;

    private String blank(String s) {
        return (s == null || s.isBlank()) ? null : s;
    }

    @Override
    public Project addProject(Project project) {
        return projectRepository.save(project);
    }

    @Override
    public Project updateProject(int id, Project newProject) {
        Project existingProject = projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        existingProject.setTitle(newProject.getTitle());
        existingProject.setDescription(newProject.getDescription());
        existingProject.setCategory(newProject.getCategory());
        existingProject.setSkills(newProject.getSkills());
        existingProject.setBudget_min(newProject.getBudget_min());
        existingProject.setBudget_max(newProject.getBudget_max());
        existingProject.setDuration(newProject.getDuration());
        existingProject.setExperienceLevel(newProject.getExperienceLevel());
        existingProject.setStatus(newProject.getStatus());
        existingProject.setDeadline(newProject.getDeadline());

        // ← ADD
        if (newProject.getClientEmail() != null) {
            existingProject.setClientEmail(newProject.getClientEmail());
        }

        if (newProject.getClient() != null) {
            existingProject.setClient(newProject.getClient());
        }

        return projectRepository.save(existingProject);
    }
    @Override
    public List<Project> getProjects() {
        return projectRepository.findAll();
    }

    @Override
    public Project getProject(int id) {
        return projectRepository.findById(id).get();
    }

    @Override
    public void deleteProject(int id) {
        if (projectRepository.existsById(id))
            projectRepository.deleteById(id);
    }

    @Override
    public List<Project> getProjectsByClientId(int clientId) {
        return projectRepository.findByClient_id(clientId);
    }

    @Override
    public List<Project> search(String query, String category,
                                Status status, Experience experience,
                                Float budgetMin, Float budgetMax) {
        return projectRepository.search(
                blank(query),
                blank(category),
                status,
                experience,
                budgetMin,
                budgetMax
        );
    }
    @Override
    public List<Project> filter(String category, Status status, Experience experience,
                                Float budgetMin, Float budgetMax) {
        return projectRepository.filter(
                blank(category),
                status,
                experience,
                budgetMin,
                budgetMax
        );
    }


    @Override
    public ProjectStatsDTO getClientStats(int clientId) {
        List<Project> projects = projectRepository.findAll();
        return buildStats(projects);
    }

    @Override
    public ProjectStatsDTO getFreelancerStats() {
        List<Project> projects = projectRepository.findAll();
        return buildStats(projects);
    }

    private ProjectStatsDTO buildStats(List<Project> projects) {
        ProjectStatsDTO dto = new ProjectStatsDTO();

        dto.setTotalProjects(projects.size());
        dto.setOpenProjects(      projects.stream().filter(p -> p.getStatus() == Status.OPEN).count());
        dto.setInProgressProjects(projects.stream().filter(p -> p.getStatus() == Status.IN_PROGRESS).count());
        dto.setCompletedProjects( projects.stream().filter(p -> p.getStatus() == Status.COMPLETED).count());
        dto.setCancelledProjects( projects.stream().filter(p -> p.getStatus() == Status.CANCELLED).count());
        dto.setArchivedProjects(  projects.stream().filter(p -> p.getStatus() == Status.DRAFT).count());

        // Budgets
        double avgMin = projects.stream()
                .mapToDouble(p -> p.getBudget_min() != null ? p.getBudget_min() : 0)
                .average().orElse(0);
        double avgMax = projects.stream()
                .mapToDouble(p -> p.getBudget_max() != null ? p.getBudget_max() : 0)
                .average().orElse(0);
        dto.setAverageBudgetMin(Math.round(avgMin * 100.0) / 100.0);
        dto.setAverageBudgetMax(Math.round(avgMax * 100.0) / 100.0);
        dto.setAverageBudget(   Math.round(((avgMin + avgMax) / 2) * 100.0) / 100.0);
        dto.setTotalBudgetMax(  projects.stream()
                .mapToDouble(p -> p.getBudget_max() != null ? p.getBudget_max() : 0).sum());

        // Top catégories
        List<String> topCategories = projects.stream()
                .filter(p -> p.getCategory() != null)
                .collect(java.util.stream.Collectors.groupingBy(
                        Project::getCategory, java.util.stream.Collectors.counting()))
                .entrySet().stream()
                .sorted(java.util.Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(5)
                .map(java.util.Map.Entry::getKey)
                .collect(java.util.stream.Collectors.toList());
        dto.setTopCategories(topCategories);

        // Top skills
        List<String> topSkills = projects.stream()
                .filter(p -> p.getSkills() != null && !p.getSkills().isBlank())
                .flatMap(p -> java.util.Arrays.stream(p.getSkills().split(",")))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(java.util.stream.Collectors.groupingBy(
                        s -> s, java.util.stream.Collectors.counting()))
                .entrySet().stream()
                .sorted(java.util.Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(8)
                .map(java.util.Map.Entry::getKey)
                .collect(java.util.stream.Collectors.toList());
        dto.setTopSkills(topSkills);

        // Projets populaires (simulé par budget décroissant — remplacer par proposalsCount si dispo)
        List<ProjectStatsDTO.PopularProject> popular = projects.stream()
                .sorted((a, b) -> Float.compare(
                        b.getBudget_max() != null ? b.getBudget_max() : 0,
                        a.getBudget_max() != null ? a.getBudget_max() : 0))
                .limit(5)
                .map(p -> new ProjectStatsDTO.PopularProject(
                        p.getId(),
                        p.getTitle(),
                        p.getCategory(),
                        p.getBudget_min() != null ? p.getBudget_min() : 0,
                        p.getBudget_max() != null ? p.getBudget_max() : 0,
                        p.getStatus() != null ? p.getStatus().name() : "",
                        0L
                ))
                .collect(java.util.stream.Collectors.toList());
        dto.setMostPopularProjects(popular);

        return dto;
    }

    // ADD après la méthode getFreelancerStats()

    @Override
    public Project getProjectById(int id) {
        return projectRepository.findById(id).orElse(null);
    }

}