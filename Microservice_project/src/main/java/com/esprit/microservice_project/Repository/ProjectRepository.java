package com.esprit.microservice_project.Repository;

import com.esprit.microservice_project.Entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProjectRepository extends JpaRepository<Project, Integer> {
    List<Project> findByClient_id(int clientId);

}
