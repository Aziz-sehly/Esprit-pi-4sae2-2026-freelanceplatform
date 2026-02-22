package com.esprit.microservice_project.Services;

import com.esprit.microservice_project.Entity.Project;

import java.util.List;

public interface IServiceProject {
    Project addProject(Project project);
    Project updateProject(int id, Project newProject);
    List<Project> getProjects();
    Project getProject(int id);
    void deleteProject(int id);
    List<Project> getProjectsByClientId(int clientId);


}
