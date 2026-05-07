package com.payment.payment.security;

public record CurrentUser(Long id, String email, String role) {

    public boolean isClient() {
        return "CLIENT".equalsIgnoreCase(role);
    }

    public boolean isFreelancer() {
        return "FREELANCER".equalsIgnoreCase(role);
    }

    public boolean isAdmin() {
        return "ADMIN".equalsIgnoreCase(role);
    }
}
