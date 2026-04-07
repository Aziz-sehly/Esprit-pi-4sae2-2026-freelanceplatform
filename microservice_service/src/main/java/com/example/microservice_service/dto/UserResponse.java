package com.example.microservice_service.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class UserResponse {
    private Long id;
    private String email;
    private String firstName;
    private String lastName;
    private String role;
    @JsonProperty("isVerified")
    private boolean isVerified;
    @JsonProperty("isActive")
    private boolean isActive;

    public boolean isVerified() {
        return Boolean.TRUE.equals(isVerified);
    }

    public boolean isActive() {
        return Boolean.TRUE.equals(isActive);
    }
}