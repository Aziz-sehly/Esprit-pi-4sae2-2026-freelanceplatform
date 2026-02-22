package com.esprit.microservice_project.Contoller;

import com.esprit.microservice_project.Entity.Project;
import com.esprit.microservice_project.Services.IServiceProject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/project")
public class ProjectRest {

    @Autowired
    IServiceProject serviceproject;

    @PostMapping("/Addproject")
    public Project Addproject(@RequestBody Project p) {
        return serviceproject.addProject(p);
    }

    @GetMapping("/GetAllProjects")
    public List<Project> GetAllProjects() {
        return serviceproject.getProjects();
    }

    @GetMapping("/GetProject/{id}")
    public Project GetProject(@PathVariable int id) {
        return serviceproject.getProject(id);
    }

    @PutMapping("/UpdateProject/{id}")
    public Project UpdateProject(@PathVariable int id, @RequestBody Project p) {
        return serviceproject.updateProject(id, p);
    }

    @DeleteMapping("/DeleteProject/{id}")
    public void DeleteProject(@PathVariable int id) {
        serviceproject.deleteProject(id);
    }

    @GetMapping("/GetProjectsByClient/{clientId}")
    public List<Project> GetProjectsByClient(@PathVariable int clientId) {
        return serviceproject.getProjectsByClientId(clientId);
    }
}