package com.prolance.user.service;

import com.prolance.user.domain.AppUser;
import com.prolance.user.dto.UserDtos;

public final class UserMapper {
    private UserMapper() {}

    public static UserDtos.UserResponse toResponse(AppUser u) {
        return new UserDtos.UserResponse(
                u.getId(),
                u.getUsername(),
                u.getEmail(),
                u.getFirstName(),
                u.getLastName(),
                u.getRole(),
                u.isEnabled(),
                u.getCreatedAt()
        );
    }

    public static UserDtos.InternalUserDto toInternal(AppUser u) {
        return new UserDtos.InternalUserDto(
                u.getId(),
                u.getUsername(),
                u.getEmail(),
                u.getFirstName(),
                u.getLastName()
        );
    }
}
