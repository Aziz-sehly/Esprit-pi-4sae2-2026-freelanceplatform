package com.prolance.user.config;

import com.prolance.user.domain.Role;
import com.prolance.user.domain.User;
import com.prolance.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class BootstrapConfig {

    @Bean
    @Order(1)
    CommandLineRunner seedAdmin(
            UserRepository repository,
            PasswordEncoder passwordEncoder,
            @Value("${app.seed-admin.username:admin}") String adminUsername,
            @Value("${app.seed-admin.email:admin@prolance.local}") String adminEmail,
            @Value("${app.seed-admin.password:admin123}") String adminPassword
    ) {
        return args -> {
            if (repository.existsByLoginUsernameIgnoreCase(adminUsername)
                    || repository.existsByEmailIgnoreCase(adminEmail)) {
                return;
            }
            User admin = new User();
            admin.setUsername(adminUsername);
            admin.setEmail(adminEmail);
            admin.setPassword(passwordEncoder.encode(adminPassword));
            admin.setFirstName("System");
            admin.setLastName("Admin");
            admin.setRole(Role.ADMIN);
            admin.setIsActive(true);
            admin.setIsVerified(true);
            repository.save(admin);
        };
    }

    /**
     * Compte utilisateur standard pour tester le front (messages, litiges) sans passer par l’e-mail de vérification.
     */
    @Bean
    @Order(2)
    CommandLineRunner seedTestUser(
            UserRepository repository,
            PasswordEncoder passwordEncoder,
            @Value("${app.seed-test-user.enabled:true}") boolean enabled,
            @Value("${app.seed-test-user.username:demo}") String username,
            @Value("${app.seed-test-user.email:demo@prolance.local}") String email,
            @Value("${app.seed-test-user.password:demo12345}") String password,
            @Value("${app.seed-test-user.first-name:Demo}") String firstName,
            @Value("${app.seed-test-user.last-name:User}") String lastName
    ) {
        return args -> {
            if (!enabled) {
                return;
            }
            if (repository.existsByLoginUsernameIgnoreCase(username)
                    || repository.existsByEmailIgnoreCase(email)) {
                return;
            }
            User demo = new User();
            demo.setUsername(username);
            demo.setEmail(email);
            demo.setPassword(passwordEncoder.encode(password));
            demo.setFirstName(firstName);
            demo.setLastName(lastName);
            demo.setRole(Role.FREELANCER);
            demo.setIsActive(true);
            demo.setIsVerified(true);
            repository.save(demo);
        };
    }
}
