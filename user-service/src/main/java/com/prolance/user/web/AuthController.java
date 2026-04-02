package com.prolance.user.web;

import com.prolance.user.dto.AuthDtos;
import com.prolance.user.dto.UserDtos;
import com.prolance.user.repository.AppUserRepository;
import com.prolance.user.service.AuthService;
import com.prolance.user.service.UserMapper;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/users")
public class AuthController {

    private final AuthService authService;
    private final AppUserRepository appUserRepository;

    public AuthController(AuthService authService, AppUserRepository appUserRepository) {
        this.authService = authService;
        this.appUserRepository = appUserRepository;
    }

    @PostMapping("/auth/register")
    public AuthDtos.AuthResponse register(@Valid @RequestBody AuthDtos.RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/auth/login")
    public AuthDtos.AuthResponse login(@Valid @RequestBody AuthDtos.LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/me")
    public UserDtos.UserResponse me(@RequestHeader(value = "X-User-Id", required = false) Long userId,
                                    Authentication authentication) {
        if (userId == null && authentication != null && authentication.getName() != null) {
            try {
                userId = Long.parseLong(authentication.getName());
            } catch (NumberFormatException ignored) {
            }
        }
        if (userId == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing user identity");
        return appUserRepository.findById(userId)
                .map(UserMapper::toResponse)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }
}
