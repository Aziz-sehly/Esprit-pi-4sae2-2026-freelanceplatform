package com.example.microservice_user.dto;

import com.example.microservice_user.entity.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

public class AuthDtos {

    // ── Register Request ──────────────────────────────────────────────
    @Data
    public static class RegisterRequest {

        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        private String email;

        @NotBlank(message = "Password is required")
        @Size(min = 8, message = "Password must be at least 8 characters")
        private String password;

        @NotBlank(message = "First name is required")
        private String firstName;

        @NotBlank(message = "Last name is required")
        private String lastName;

        @NotNull(message = "Role is required")
        private Role role;

        private String phoneNumber;

        // Freelancer-specific
        private String skills;
        private String portfolioUrl;

        // Client-specific
        private String companyName;
    }

    // ── Login Request ─────────────────────────────────────────────────
    @Data
    public static class LoginRequest {

        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        private String email;

        @NotBlank(message = "Password is required")
        private String password;
    }

    // ── Auth Response (returned after login) ──────────────────────────
    @Data
    public static class AuthResponse {
        private String token;
        private UserResponse user;

        public AuthResponse(String token, UserResponse user) {
            this.token = token;
            this.user = user;
        }
    }

    // ── User Response (safe — no password) ───────────────────────────
    @Data
    public static class UserResponse {
        private Long id;
        private String email;
        private String firstName;
        private String lastName;
        private Role role;
        private String profilePicture;
        private String bio;
        private String phoneNumber;
        private String skills;
        private String portfolioUrl;
        private String companyName;
        private Boolean isVerified;
        private Boolean isActive;
    }

    // ── Update Profile Request ────────────────────────────────────────
    @Data
    public static class UpdateProfileRequest {
        private String firstName;
        private String lastName;
        private String bio;
        private String phoneNumber;
        private String profilePicture;
        private String skills;
        private String portfolioUrl;
        private String companyName;
    }
}
