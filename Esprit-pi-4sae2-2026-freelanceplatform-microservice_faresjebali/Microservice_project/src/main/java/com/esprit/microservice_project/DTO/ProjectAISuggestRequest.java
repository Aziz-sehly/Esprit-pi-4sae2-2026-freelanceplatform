package com.esprit.microservice_project.DTO;

import lombok.Data;

@Data
public class ProjectAISuggestRequest {
    private String description;
    private String duration;
}