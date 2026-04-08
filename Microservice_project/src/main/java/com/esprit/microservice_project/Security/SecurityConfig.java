package com.esprit.microservice_project.Security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Allow CORS preflight for all routes
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        // Allow error forwarding
                        .requestMatchers("/error").permitAll()
                        // Public — no auth required
                        .requestMatchers("/project/GetAllProjects").permitAll()
                        .requestMatchers("/project/GetProject/**").permitAll()
                        .requestMatchers("/project/GetProjectsByClient/**").permitAll()
                        .requestMatchers("/project/search").permitAll()
                        .requestMatchers("/project/filter").permitAll()
                        .requestMatchers("/project/stats").permitAll()
                        .requestMatchers("/project/stats/**").permitAll()
                        // Internal — called by other microservices
                        .requestMatchers("/project/notify/**").permitAll()
                        .requestMatchers("/actuator/**").permitAll()
                        // Everything else requires a valid JWT
                        // (@PreAuthorize on controller handles role checks)
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}