package com.esprit.microservice_proposal.DTO;

import lombok.*;
import java.time.LocalDate;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class Project {
    private Integer id;
    private String title;
    private String description;
    private String category;
    private String skills;
    private Float budget_min;
    private Float budget_max;
    private String duration;
    private String status;
    private LocalDate deadline;
}