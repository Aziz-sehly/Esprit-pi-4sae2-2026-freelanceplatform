package com.prolance.user.service;

import com.prolance.user.domain.AppUser;
import com.prolance.user.domain.UserRole;
import com.prolance.user.dto.UserDtos;
import com.prolance.user.repository.AppUserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class UserAdminService {

    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;

    public UserAdminService(AppUserRepository appUserRepository, PasswordEncoder passwordEncoder) {
        this.appUserRepository = appUserRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<UserDtos.UserResponse> listAll() {
        return appUserRepository.findAll().stream()
                .map(UserMapper::toResponse)
                .toList();
    }

    public UserDtos.UserResponse create(UserDtos.AdminCreateUserRequest request) {
        if (appUserRepository.existsByUsernameIgnoreCase(request.username())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already exists");
        }
        if (appUserRepository.existsByEmailIgnoreCase(request.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already exists");
        }
        AppUser user = new AppUser();
        user.setUsername(request.username().trim());
        user.setEmail(request.email().trim().toLowerCase());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setFirstName(request.firstName());
        user.setLastName(request.lastName());
        user.setRole(request.role() != null ? request.role() : UserRole.USER);
        user.setEnabled(request.enabled() == null || request.enabled());
        return UserMapper.toResponse(appUserRepository.save(user));
    }

    public UserDtos.UserResponse update(Long id, UserDtos.AdminUpdateUserRequest request) {
        AppUser user = appUserRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (request.username() != null && !request.username().isBlank()) user.setUsername(request.username().trim());
        if (request.email() != null && !request.email().isBlank()) user.setEmail(request.email().trim().toLowerCase());
        if (request.password() != null && !request.password().isBlank()) user.setPasswordHash(passwordEncoder.encode(request.password()));
        if (request.firstName() != null) user.setFirstName(request.firstName());
        if (request.lastName() != null) user.setLastName(request.lastName());
        if (request.role() != null) user.setRole(request.role());
        if (request.enabled() != null) user.setEnabled(request.enabled());
        return UserMapper.toResponse(appUserRepository.save(user));
    }

    public void delete(Long id) {
        if (!appUserRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }
        appUserRepository.deleteById(id);
    }

    public UserDtos.UserResponse getById(Long id) {
        AppUser user = appUserRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        return UserMapper.toResponse(user);
    }

    public List<UserDtos.InternalUserDto> internalList(Long excludeUserId) {
        return appUserRepository.findAll().stream()
                .filter(u -> excludeUserId == null || !u.getId().equals(excludeUserId))
                .map(UserMapper::toInternal)
                .toList();
    }

    public Set<Long> internalSearchIds(String query) {
        if (query == null || query.isBlank()) return Set.of();
        return appUserRepository
                .findByUsernameContainingIgnoreCaseOrEmailContainingIgnoreCaseOrFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(
                        query.trim(), query.trim(), query.trim(), query.trim()
                )
                .stream()
                .map(AppUser::getId)
                .collect(Collectors.toSet());
    }
}
