package com.prolance.user.repository;

import com.prolance.user.domain.Role;
import com.prolance.user.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmailIgnoreCase(String email);

    Optional<User> findByLoginUsernameIgnoreCase(String loginUsername);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByLoginUsernameIgnoreCase(String loginUsername);

    Optional<User> findByVerificationToken(String token);

    List<User> findByRole(Role role);
}
