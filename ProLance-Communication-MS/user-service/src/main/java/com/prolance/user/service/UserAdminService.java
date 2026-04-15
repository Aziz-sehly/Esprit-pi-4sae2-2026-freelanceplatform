package com.prolance.user.service;

import com.prolance.user.domain.Role;
import com.prolance.user.domain.User;
import com.prolance.user.dto.UserDtos;
import com.prolance.user.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class UserAdminService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserAdminService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<UserDtos.UserResponse> listAll() {
        return userRepository.findAll().stream()
                .map(UserMappings::toManagedUser)
                .toList();
    }

    public UserDtos.UserResponse create(UserDtos.AdminCreateUserRequest request) {
        if (userRepository.existsByLoginUsernameIgnoreCase(request.username())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Nom d'utilisateur déjà utilisé");
        }
        if (userRepository.existsByEmailIgnoreCase(request.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "E-mail déjà utilisé");
        }

        User user = new User();
        user.setUsername(request.username().trim());
        user.setEmail(request.email().trim().toLowerCase(Locale.ROOT));
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setFirstName(blankToDash(request.firstName()));
        user.setLastName(blankToDash(request.lastName()));
        user.setRole(UserMappings.fromAdminUserRole(request.role()));
        user.setIsActive(request.enabled() == null || request.enabled());
        user.setIsVerified(true);

        return UserMappings.toManagedUser(userRepository.save(user));
    }

    public UserDtos.UserResponse update(Long id, UserDtos.AdminUpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilisateur introuvable"));

        if (request.username() != null && !request.username().isBlank()) {
            String u = request.username().trim();
            userRepository.findByLoginUsernameIgnoreCase(u)
                    .filter(other -> !other.getId().equals(id))
                    .ifPresent(x -> {
                        throw new ResponseStatusException(HttpStatus.CONFLICT, "Nom d'utilisateur déjà utilisé");
                    });
            user.setUsername(u);
        }
        if (request.email() != null && !request.email().isBlank()) {
            String e = request.email().trim().toLowerCase(Locale.ROOT);
            userRepository.findByEmailIgnoreCase(e)
                    .filter(other -> !other.getId().equals(id))
                    .ifPresent(x -> {
                        throw new ResponseStatusException(HttpStatus.CONFLICT, "E-mail déjà utilisé");
                    });
            user.setEmail(e);
        }
        if (request.password() != null && !request.password().isBlank()) {
            user.setPassword(passwordEncoder.encode(request.password()));
        }
        if (request.firstName() != null) {
            user.setFirstName(request.firstName());
        }
        if (request.lastName() != null) {
            user.setLastName(request.lastName());
        }
        if (request.role() != null) {
            user.setRole(UserMappings.fromAdminUserRole(request.role()));
        }
        if (request.enabled() != null) {
            user.setIsActive(request.enabled());
        }

        return UserMappings.toManagedUser(userRepository.save(user));
    }

    public void delete(Long id) {
        if (!userRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilisateur introuvable");
        }
        userRepository.deleteById(id);
    }

    public UserDtos.UserResponse getById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilisateur introuvable"));
        return UserMappings.toManagedUser(user);
    }

    public List<UserDtos.InternalUserDto> internalList(Long excludeUserId) {
        return userRepository.findAll().stream()
                .filter(u -> excludeUserId == null || !u.getId().equals(excludeUserId))
                .map(UserMappings::toInternal)
                .toList();
    }

    public Set<Long> internalSearchIds(String query) {
        if (query == null || query.isBlank()) {
            return Set.of();
        }
        String q = query.trim().toLowerCase(Locale.ROOT);
        return userRepository.findAll().stream()
                .filter(u -> matches(u, q))
                .map(User::getId)
                .collect(Collectors.toSet());
    }

    private static boolean matches(User u, String q) {
        String full = ((u.getFirstName() == null ? "" : u.getFirstName()) + " "
                + (u.getLastName() == null ? "" : u.getLastName())).toLowerCase(Locale.ROOT);
        String un = u.getLoginUsername() == null ? "" : u.getLoginUsername().toLowerCase(Locale.ROOT);
        String em = u.getEmail() == null ? "" : u.getEmail().toLowerCase(Locale.ROOT);
        return full.contains(q) || em.contains(q) || un.contains(q);
    }

    private static String blankToDash(String s) {
        if (s == null || s.isBlank()) {
            return "-";
        }
        return s.trim();
    }
}
