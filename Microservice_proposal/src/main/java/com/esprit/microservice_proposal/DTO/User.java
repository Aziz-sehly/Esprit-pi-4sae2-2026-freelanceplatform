package com.esprit.microservice_proposal.DTO;

import lombok.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class User {
    private int id;
    private String email;
    private String name;      // kept for contract compatibility
    private String role;

    // Fields from AuthDtos.UserResponse
    private String firstName;
    private String lastName;
    private Boolean isVerified;
    private Boolean isActive;

    // Convenience: full name for contract emails
    public String getName() {
        if (firstName != null && lastName != null) return firstName + " " + lastName;
        if (name != null) return name;
        return "User " + id;
    }

    // Constructor used by getUserSafe fallback
    public User(int id, String name, String email, String role) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.role = role;
    }
}