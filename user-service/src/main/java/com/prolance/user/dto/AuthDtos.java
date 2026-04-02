package com.prolance.user.dto;

import com.prolance.user.domain.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AuthDtos {
    public record RegisterRequest(
            @NotBlank @Size(min = 3, max = 120) String username,
            @NotBlank @Email @Size(max = 180) String email,
            @NotBlank @Size(min = 6, max = 120) String password,
            @Size(max = 100) String firstName,
            @Size(max = 100) String lastName
    ) {}

    public record LoginRequest(
            @NotBlank String usernameOrEmail,
            @NotBlank String password
    ) {}

    public record AuthResponse(
            String token,
            Long id,
            String username,
            String email,
            String firstName,
            String lastName,
            UserRole role
    ) {}
}
