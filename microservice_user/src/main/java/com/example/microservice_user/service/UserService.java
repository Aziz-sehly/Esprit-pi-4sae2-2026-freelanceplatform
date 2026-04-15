package com.example.microservice_user.service;

import com.example.microservice_user.dto.AuthDtos;
import com.example.microservice_user.entity.User;
import com.example.microservice_user.entity.enums.Role;
import com.example.microservice_user.repository.UserRepository;
import com.example.microservice_user.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;

    @Value("${app.verification.token-expiry}")
    private long tokenExpiry;

    // ── Register ──────────────────────────────────────────────────────
    public String register(AuthDtos.RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalStateException("Email already in use: " + request.getEmail());
        }

        String verificationToken = UUID.randomUUID().toString();

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .role(request.getRole())
                .phoneNumber(request.getPhoneNumber())
                .skills(request.getSkills())
                .portfolioUrl(request.getPortfolioUrl())
                .companyName(request.getCompanyName())
                .isVerified(false)
                .isActive(true)
                .verificationToken(verificationToken)
                .verificationTokenExpiry(LocalDateTime.now().plusSeconds(tokenExpiry / 1000))
                .build();

        userRepository.save(user);
        emailService.sendVerificationEmail(user.getEmail(), user.getFirstName(), verificationToken);

        return "Registration successful. Please check your email to verify your account.";
    }

    // ── Login ─────────────────────────────────────────────────────────
    public AuthDtos.AuthResponse login(AuthDtos.LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!user.getIsVerified()) {
            throw new IllegalStateException("Please verify your email before logging in.");
        }

        if (!user.getIsActive()) {
            throw new IllegalStateException("Your account has been disabled. Contact support.");
        }

        String token = jwtService.generateToken(user);

        return new AuthDtos.AuthResponse(token, toResponse(user));
    }

    // ── Verify Email ──────────────────────────────────────────────────
    public String verifyEmail(String token) {
        User user = userRepository.findByVerificationToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid or expired verification token."));

        if (user.getVerificationTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new IllegalStateException("Verification token has expired. Please register again.");
        }

        user.setIsVerified(true);
        user.setVerificationToken(null);
        user.setVerificationTokenExpiry(null);
        userRepository.save(user);

        return "Email verified successfully. You can now log in.";
    }

    // ── Get User by ID ────────────────────────────────────────────────
    public AuthDtos.UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
        return toResponse(user);
    }

    // ── Get User by Email ─────────────────────────────────────────────
    public AuthDtos.UserResponse getUserByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));
        return toResponse(user);
    }

    // ── Get All Users ─────────────────────────────────────────────────
    public List<AuthDtos.UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // ── Get Users by Role ─────────────────────────────────────────────
    public List<AuthDtos.UserResponse> getUsersByRole(Role role) {
        return userRepository.findByRole(role).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<AuthDtos.UserResponse> getDiscoverableFreelancers() {
        return userRepository.findByRole(Role.FREELANCER).stream()
                .filter(user -> Boolean.TRUE.equals(user.getIsActive()) && Boolean.TRUE.equals(user.getIsVerified()))
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // ── Update Profile ────────────────────────────────────────────────
    public AuthDtos.UserResponse updateProfile(Long id, AuthDtos.UpdateProfileRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));

        if (request.getFirstName() != null) user.setFirstName(request.getFirstName());
        if (request.getLastName() != null) user.setLastName(request.getLastName());
        if (request.getBio() != null) user.setBio(request.getBio());
        if (request.getPhoneNumber() != null) user.setPhoneNumber(request.getPhoneNumber());
        if (request.getProfilePicture() != null) user.setProfilePicture(request.getProfilePicture());
        if (request.getSkills() != null) user.setSkills(request.getSkills());
        if (request.getPortfolioUrl() != null) user.setPortfolioUrl(request.getPortfolioUrl());
        if (request.getCompanyName() != null) user.setCompanyName(request.getCompanyName());

        return toResponse(userRepository.save(user));
    }

    // ── Admin: Toggle Active ──────────────────────────────────────────
    public AuthDtos.UserResponse toggleActive(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
        user.setIsActive(!user.getIsActive());
        return toResponse(userRepository.save(user));
    }

    // ── Map to Response ───────────────────────────────────────────────
    public AuthDtos.UserResponse toResponse(User user) {
        AuthDtos.UserResponse response = new AuthDtos.UserResponse();
        response.setId(user.getId());
        response.setEmail(user.getEmail());
        response.setFirstName(user.getFirstName());
        response.setLastName(user.getLastName());
        response.setRole(user.getRole());
        response.setProfilePicture(user.getProfilePicture());
        response.setBio(user.getBio());
        response.setPhoneNumber(user.getPhoneNumber());
        response.setSkills(user.getSkills());
        response.setPortfolioUrl(user.getPortfolioUrl());
        response.setCompanyName(user.getCompanyName());
        response.setIsVerified(user.getIsVerified());
        response.setIsActive(user.getIsActive());
        return response;
    }
}
