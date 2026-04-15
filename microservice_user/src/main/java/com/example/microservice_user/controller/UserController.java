package com.example.microservice_user.controller;

import com.example.microservice_user.dto.AuthDtos;
import com.example.microservice_user.entity.enums.Role;
import com.example.microservice_user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // Public — used by other microservices to fetch user info by ID
    @GetMapping("/public/{id}")
    public ResponseEntity<AuthDtos.UserResponse> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    // Public — used by other microservices to fetch user info by email
    @GetMapping("/public/email/{email}")
    public ResponseEntity<AuthDtos.UserResponse> getUserByEmail(@PathVariable String email) {
        return ResponseEntity.ok(userService.getUserByEmail(email));
    }

    @GetMapping("/public/freelancers")
    public ResponseEntity<List<AuthDtos.UserResponse>> getDiscoverableFreelancers() {
        return ResponseEntity.ok(userService.getDiscoverableFreelancers());
    }

    // Authenticated — get own profile
    @GetMapping("/me")
    public ResponseEntity<AuthDtos.UserResponse> getMe(
            @RequestHeader("Authorization") String authHeader) {
        // Extract email from token via the header
        String token = authHeader.substring(7);
        // We re-use getUserByEmail since JWT subject is email
        return ResponseEntity.ok(userService.getUserByEmail(
                extractEmailFromToken(token)
        ));
    }

    // Authenticated — update own profile
    @PutMapping("/{id}")
    public ResponseEntity<AuthDtos.UserResponse> updateProfile(
            @PathVariable Long id,
            @RequestBody AuthDtos.UpdateProfileRequest request) {
        return ResponseEntity.ok(userService.updateProfile(id, request));
    }

    // Admin — get all users
    @GetMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<List<AuthDtos.UserResponse>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    // Admin — get users by role
    @GetMapping("/role/{role}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<List<AuthDtos.UserResponse>> getUsersByRole(@PathVariable Role role) {
        return ResponseEntity.ok(userService.getUsersByRole(role));
    }

    // Admin — toggle user active/disabled
    @PatchMapping("/admin/{id}/toggle-active")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<AuthDtos.UserResponse> toggleActive(@PathVariable Long id) {
        return ResponseEntity.ok(userService.toggleActive(id));
    }

    // Helper — extract email from JWT (the subject)
    private String extractEmailFromToken(String token) {
        // Decode JWT payload (base64) to get subject
        String[] parts = token.split("\\.");
        String payload = new String(java.util.Base64.getUrlDecoder().decode(parts[1]));
        // Extract "sub" field
        int subStart = payload.indexOf("\"sub\":\"") + 7;
        int subEnd = payload.indexOf("\"", subStart);
        return payload.substring(subStart, subEnd);
    }
}
