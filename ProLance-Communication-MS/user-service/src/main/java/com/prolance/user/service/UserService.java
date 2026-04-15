package com.prolance.user.service;

import com.prolance.user.domain.Role;
import com.prolance.user.domain.User;
import com.prolance.user.dto.AuthDtos;
import com.prolance.user.repository.UserRepository;
import com.prolance.user.security.JwtService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;

    @Value("${app.verification.token-expiry-ms:86400000}")
    private long tokenExpiryMs;

    public UserService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AuthenticationManager authenticationManager,
            EmailService emailService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
        this.emailService = emailService;
    }

    public AuthDtos.RegisterResponse register(AuthDtos.RegisterRequest request) {
        if (userRepository.existsByEmailIgnoreCase(request.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Un compte existe déjà avec cet e-mail");
        }
        if (userRepository.existsByLoginUsernameIgnoreCase(request.username())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ce nom d'utilisateur est déjà pris");
        }

        String verificationToken = UUID.randomUUID().toString();
        String fn = request.firstName() != null && !request.firstName().isBlank()
                ? request.firstName().trim() : "-";
        String ln = request.lastName() != null && !request.lastName().isBlank()
                ? request.lastName().trim() : "-";

        User user = new User();
        user.setUsername(request.username().trim());
        user.setEmail(request.email().trim().toLowerCase(Locale.ROOT));
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setFirstName(fn);
        user.setLastName(ln);
        user.setRole(Role.FREELANCER);
        user.setIsVerified(false);
        user.setIsActive(true);
        user.setVerificationToken(verificationToken);
        user.setVerificationTokenExpiry(LocalDateTime.now().plusSeconds(tokenExpiryMs / 1000));

        userRepository.save(user);
        emailService.sendVerificationEmail(user.getEmail(), user.getFirstName(), verificationToken);

        return new AuthDtos.RegisterResponse(
                "Inscription réussie. Vérifiez votre boîte e-mail pour activer votre compte.");
    }

    public AuthDtos.AuthResponse login(AuthDtos.LoginRequest request) {
        String key = request.resolveLoginKey();
        if (key == null || key.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Identifiant ou e-mail requis");
        }

        User user = resolveByUsernameOrEmail(key)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Aucun compte pour cet identifiant ou cet e-mail"));

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(user.getEmail(), request.getPassword())
        );

        if (!Boolean.TRUE.equals(user.getIsVerified())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Vérifiez votre e-mail avant de vous connecter.");
        }
        if (!Boolean.TRUE.equals(user.getIsActive())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Compte désactivé. Contactez l'administrateur.");
        }

        String token = jwtService.generateToken(user);
        return UserMappings.toAuthResponse(token, user);
    }

    public String verifyEmail(String token) {
        User user = userRepository.findByVerificationToken(token)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Lien de vérification invalide ou expiré."));

        if (user.getVerificationTokenExpiry() != null
                && user.getVerificationTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Le lien de vérification a expiré. Inscrivez-vous à nouveau.");
        }

        user.setIsVerified(true);
        user.setVerificationToken(null);
        user.setVerificationTokenExpiry(null);
        userRepository.save(user);
        return "E-mail vérifié. Vous pouvez vous connecter.";
    }

    public AuthDtos.UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilisateur introuvable"));
        return UserMappings.toPublicUserResponse(user);
    }

    public AuthDtos.UserResponse getUserByEmail(String email) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilisateur introuvable"));
        return UserMappings.toPublicUserResponse(user);
    }

    public List<AuthDtos.UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(UserMappings::toPublicUserResponse)
                .collect(Collectors.toList());
    }

    public AuthDtos.UserResponse verifyUserByEmail(String email) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilisateur introuvable"));
        user.setIsVerified(true);
        user.setVerificationToken(null);
        user.setVerificationTokenExpiry(null);
        return UserMappings.toPublicUserResponse(userRepository.save(user));
    }

    public List<AuthDtos.UserResponse> getUsersByRole(Role role) {
        return userRepository.findByRole(role).stream()
                .map(UserMappings::toPublicUserResponse)
                .collect(Collectors.toList());
    }

    public AuthDtos.UserResponse updateProfile(Long id, AuthDtos.UpdateProfileRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilisateur introuvable"));

        if (request.firstName() != null) {
            user.setFirstName(request.firstName());
        }
        if (request.lastName() != null) {
            user.setLastName(request.lastName());
        }
        if (request.bio() != null) {
            user.setBio(request.bio());
        }
        if (request.phoneNumber() != null) {
            user.setPhoneNumber(request.phoneNumber());
        }
        if (request.profilePicture() != null) {
            user.setProfilePicture(request.profilePicture());
        }
        if (request.skills() != null) {
            user.setSkills(request.skills());
        }
        if (request.portfolioUrl() != null) {
            user.setPortfolioUrl(request.portfolioUrl());
        }
        if (request.companyName() != null) {
            user.setCompanyName(request.companyName());
        }

        return UserMappings.toPublicUserResponse(userRepository.save(user));
    }

    public AuthDtos.UserResponse toggleActive(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilisateur introuvable"));
        user.setIsActive(!Boolean.TRUE.equals(user.getIsActive()));
        return UserMappings.toPublicUserResponse(userRepository.save(user));
    }

    public AuthDtos.MeResponse me(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilisateur introuvable"));
        return UserMappings.toMeResponse(user);
    }

    private Optional<User> resolveByUsernameOrEmail(String key) {
        if (key.contains("@")) {
            return userRepository.findByEmailIgnoreCase(key);
        }
        return userRepository.findByLoginUsernameIgnoreCase(key);
    }
}
