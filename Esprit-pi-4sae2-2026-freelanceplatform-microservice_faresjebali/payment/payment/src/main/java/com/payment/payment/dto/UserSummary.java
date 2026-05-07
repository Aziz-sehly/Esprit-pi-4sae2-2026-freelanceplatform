package com.payment.payment.dto;

public record UserSummary(
        Long id,
        String email,
        String firstName,
        String lastName,
        Boolean isVerified,
        Boolean isActive
) {
}
