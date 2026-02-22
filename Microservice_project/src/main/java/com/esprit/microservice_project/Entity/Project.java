package com.esprit.microservice_project.Entity;

import com.esprit.microservice_project.DTO.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    // ← REMPLACER client_id int par ceci
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "client_id", nullable = false)
    private User client;

    private String title;
    private String description;
    private String category;
    private String skills;
    private Float  budget_min;
    private Float  budget_max;
    private String duration;

    @Enumerated(EnumType.STRING)
    private Experience experienceLevel;

    @Enumerated(EnumType.STRING)
    private Status status;

    private LocalDate deadline;
}
