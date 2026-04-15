package com.prolance.user.service;

import com.prolance.user.domain.Role;
import com.prolance.user.domain.User;
import com.prolance.user.dto.AuthDtos;
import com.prolance.user.dto.UserDtos;

final class UserMappings {

    private UserMappings() {
    }

    static AuthDtos.ApiUserRole toApiRole(Role r) {
        return r == Role.ADMIN ? AuthDtos.ApiUserRole.ADMIN : AuthDtos.ApiUserRole.USER;
    }

    static UserDtos.AdminUserRole toAdminUserRole(Role r) {
        return r == Role.ADMIN ? UserDtos.AdminUserRole.ADMIN : UserDtos.AdminUserRole.USER;
    }

    static Role fromAdminUserRole(UserDtos.AdminUserRole r) {
        if (r == null) {
            return Role.FREELANCER;
        }
        return r == UserDtos.AdminUserRole.ADMIN ? Role.ADMIN : Role.FREELANCER;
    }

    static AuthDtos.AuthResponse toAuthResponse(String token, User user) {
        return new AuthDtos.AuthResponse(
                token,
                user.getId(),
                user.getLoginUsername(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                toApiRole(user.getRole())
        );
    }

    static AuthDtos.MeResponse toMeResponse(User user) {
        return new AuthDtos.MeResponse(
                user.getId(),
                user.getLoginUsername(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                toApiRole(user.getRole())
        );
    }

    static AuthDtos.UserResponse toPublicUserResponse(User user) {
        return new AuthDtos.UserResponse(
                user.getId(),
                user.getLoginUsername(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getRole(),
                user.getProfilePicture(),
                user.getBio(),
                user.getPhoneNumber(),
                user.getSkills(),
                user.getPortfolioUrl(),
                user.getCompanyName(),
                user.getIsVerified(),
                user.getIsActive()
        );
    }

    static UserDtos.UserResponse toManagedUser(User user) {
        return new UserDtos.UserResponse(
                user.getId(),
                user.getLoginUsername(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                toAdminUserRole(user.getRole()),
                Boolean.TRUE.equals(user.getIsActive()),
                user.getCreatedAt()
        );
    }

    static UserDtos.InternalUserDto toInternal(User user) {
        return new UserDtos.InternalUserDto(
                user.getId(),
                user.getLoginUsername(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName()
        );
    }
}
