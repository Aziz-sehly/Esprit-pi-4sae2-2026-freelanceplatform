package com.prolance.user.config;

import com.prolance.user.domain.AppUser;
import com.prolance.user.domain.UserRole;
import com.prolance.user.repository.AppUserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class BootstrapConfig {

    @Bean
    CommandLineRunner seedAdmin(
            AppUserRepository repository,
            PasswordEncoder passwordEncoder,
            @Value("${app.seed-admin.username:admin}") String adminUsername,
            @Value("${app.seed-admin.email:admin@prolance.local}") String adminEmail,
            @Value("${app.seed-admin.password:admin123}") String adminPassword
    ) {
        return args -> {
            if (repository.existsByUsernameIgnoreCase(adminUsername)) return;
            AppUser admin = new AppUser();
            admin.setUsername(adminUsername);
            admin.setEmail(adminEmail);
            admin.setPasswordHash(passwordEncoder.encode(adminPassword));
            admin.setFirstName("System");
            admin.setLastName("Admin");
            admin.setRole(UserRole.ADMIN);
            admin.setEnabled(true);
            repository.save(admin);
        };
    }
}
