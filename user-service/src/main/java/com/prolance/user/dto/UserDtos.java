package com.prolance.user.dto;

import com.prolance.user.domain.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public class UserDtos {
    public record UserResponse(
            Long id,
            String username,
            String email,
            String firstName,
            String lastName,
            UserRole role,
            boolean enabled,
            LocalDateTime createdAt
    ) {}

    public record AdminCreateUserRequest(
            @NotBlank @Size(min = 3, max = 120) String username,
            @NotBlank @Email @Size(max = 180) String email,
            @NotBlank @Size(min = 6, max = 120) String password,
            @Size(max = 100) String firstName,
            @Size(max = 100) String lastName,
            UserRole role,
            Boolean enabled
    ) {}

    public record AdminUpdateUserRequest(
            @Size(min = 3, max = 120) String username,
            @Email @Size(max = 180) String email,
            @Size(min = 6, max = 120) String password,
            @Size(max = 100) String firstName,
            @Size(max = 100) String lastName,
            UserRole role,
            Boolean enabled
    ) {}

    public record InternalUserDto(
            Long id,
            String username,
            String email,
            String firstName,
            String lastName
    ) {}
}
