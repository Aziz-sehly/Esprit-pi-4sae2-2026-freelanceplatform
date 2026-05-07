package com.milestone.milestone.dto;

public record UserSummary(
        Long id,
        String email,
        String firstName,
        String lastName,
        String role,
        String profilePicture,
        String bio,
        String phoneNumber,
        String skills,
        String portfolioUrl,
        String companyName,
        Boolean isVerified,
        Boolean isActive
) {}
