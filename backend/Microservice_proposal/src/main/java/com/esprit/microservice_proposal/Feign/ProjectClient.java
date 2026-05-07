package com.esprit.microservice_proposal.Feign;

import com.esprit.microservice_proposal.DTO.Project;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@FeignClient(name = "microservice-project", url = "http://localhost:8091")
public interface ProjectClient {

    @GetMapping("/project/GetAllProjects")
    List<Project> getAllProjects();

    @GetMapping("/project/GetProject/{id}")
    Project getProjectById(@PathVariable("id") int id);

    @PutMapping("/project/UpdateProjectStatus/{id}")
    Project updateProjectStatus(@PathVariable("id") int id,
                                @RequestParam("status") String status);

}