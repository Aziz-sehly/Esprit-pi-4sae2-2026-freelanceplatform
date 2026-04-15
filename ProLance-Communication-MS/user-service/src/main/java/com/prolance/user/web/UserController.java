package com.prolance.user.web;

import com.prolance.user.domain.Role;
import com.prolance.user.domain.User;
import com.prolance.user.dto.AuthDtos;
import com.prolance.user.dto.UserDtos;
import com.prolance.user.service.UserAdminService;
import com.prolance.user.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final UserAdminService userAdminService;

    public UserController(UserService userService, UserAdminService userAdminService) {
        this.userService = userService;
        this.userAdminService = userAdminService;
    }

    @GetMapping("/public/{id}")
    public ResponseEntity<AuthDtos.UserResponse> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @GetMapping("/public/email/{email}")
    public ResponseEntity<AuthDtos.UserResponse> getUserByEmail(@PathVariable String email) {
        return ResponseEntity.ok(userService.getUserByEmail(email));
    }

    @GetMapping("/me")
    public AuthDtos.MeResponse getMe(
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            Authentication authentication
    ) {
        if (userId != null) {
            return userService.me(userId);
        }
        if (authentication != null && authentication.getPrincipal() instanceof User u) {
            return userService.me(u.getId());
        }
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Identité utilisateur manquante");
    }

    @PutMapping("/{id}")
    public ResponseEntity<AuthDtos.UserResponse> updateProfile(
            @PathVariable Long id,
            @RequestBody AuthDtos.UpdateProfileRequest request,
            Authentication authentication
    ) {
        assertSelfOrAdmin(id, authentication);
        return ResponseEntity.ok(userService.updateProfile(id, request));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AuthDtos.UserResponse>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/internal/list")
    public ResponseEntity<List<UserDtos.InternalUserDto>> getInternalUsers(
            @RequestParam(required = false) Long excludeUserId) {
        return ResponseEntity.ok(userAdminService.internalList(excludeUserId));
    }

    @GetMapping("/internal/search-ids")
    public ResponseEntity<Set<Long>> searchInternalUserIds(@RequestParam String query) {
        return ResponseEntity.ok(userAdminService.internalSearchIds(query));
    }

    @PatchMapping("/internal/force-verify")
    public ResponseEntity<AuthDtos.UserResponse> forceVerifyUser(@RequestParam String email) {
        return ResponseEntity.ok(userService.verifyUserByEmail(email));
    }

    @GetMapping("/role/{role}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AuthDtos.UserResponse>> getUsersByRole(@PathVariable Role role) {
        return ResponseEntity.ok(userService.getUsersByRole(role));
    }

    @PatchMapping("/admin/{id}/toggle-active")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AuthDtos.UserResponse> toggleActive(@PathVariable Long id) {
        return ResponseEntity.ok(userService.toggleActive(id));
    }

    private static void assertSelfOrAdmin(Long id, Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof User u)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Accès refusé");
        }
        if (Role.ADMIN.equals(u.getRole())) {
            return;
        }
        if (!id.equals(u.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Vous ne pouvez modifier que votre propre profil");
        }
    }
}
