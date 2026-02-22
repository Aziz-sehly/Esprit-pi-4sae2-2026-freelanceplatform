package com.esprit.microservice_project.Services;

import com.esprit.microservice_project.Entity.Project;
import com.esprit.microservice_project.Repository.ProjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ServiceProject implements IServiceProject {

    @Autowired
    private ProjectRepository projectRepository;

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

        // Ne touche au client QUE si fourni dans le body
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
}