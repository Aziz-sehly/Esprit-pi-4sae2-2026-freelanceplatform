package com.prolance.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AuthDtos {

    public enum ApiUserRole {
        USER,
        ADMIN
    }

    public record RegisterRequest(
            @NotBlank @Size(min = 3, max = 120) String username,
            @NotBlank @Email @Size(max = 180) String email,
            @NotBlank @Size(min = 8, max = 120) String password,
            @Size(max = 100) String firstName,
            @Size(max = 100) String lastName
    ) {}

    public record RegisterResponse(String message) {}

    public static class LoginRequest {
        private String usernameOrEmail;
        private String email;
        @NotBlank
        private String password;

        public String getUsernameOrEmail() {
            return usernameOrEmail;
        }

        public void setUsernameOrEmail(String usernameOrEmail) {
            this.usernameOrEmail = usernameOrEmail;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }

        public String resolveLoginKey() {
            if (usernameOrEmail != null && !usernameOrEmail.isBlank()) {
                return usernameOrEmail.trim();
            }
            if (email != null && !email.isBlank()) {
                return email.trim();
            }
            return null;
        }
    }

    public record AuthResponse(
            String token,
            Long id,
            String username,
            String email,
            String firstName,
            String lastName,
            ApiUserRole role
    ) {}

    /** Réponse de {@code GET /api/users/me} (format attendu par le client Angular). */
    public record MeResponse(
            Long id,
            String username,
            String email,
            String firstName,
            String lastName,
            ApiUserRole role
    ) {}

    public record UserResponse(
            Long id,
            String username,
            String email,
            String firstName,
            String lastName,
            com.prolance.user.domain.Role role,
            String profilePicture,
            String bio,
            String phoneNumber,
            String skills,
            String portfolioUrl,
            String companyName,
            Boolean isVerified,
            Boolean isActive
    ) {}

    public record UpdateProfileRequest(
            String firstName,
            String lastName,
            String bio,
            String phoneNumber,
            String profilePicture,
            String skills,
            String portfolioUrl,
            String companyName
    ) {}
}
