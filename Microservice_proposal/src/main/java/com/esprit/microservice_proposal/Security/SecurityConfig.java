package com.esprit.microservice_proposal.Security;

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
                        // CORS preflight
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        // Error forwarding
                        .requestMatchers("/error").permitAll()
                        // ── Public read-only endpoints ────────────────────
                        .requestMatchers("/proposal/GetAllProposals").permitAll()
                        .requestMatchers("/proposal/GetProposal/**").permitAll()
                        .requestMatchers("/proposal/GetProposalsByProject/**").permitAll()
                        .requestMatchers("/proposal/GetProposalsByFreelancer/**").permitAll()
                        .requestMatchers("/proposal/GetProject/**").permitAll()
                        .requestMatchers("/proposal/GetFreelancer/**").permitAll()
                        .requestMatchers("/proposal/GetAllProjects").permitAll()
                        .requestMatchers("/proposal/ranked/**").permitAll()
                        .requestMatchers("/proposal/stats/**").permitAll()
                        .requestMatchers("/actuator/**").permitAll()
                        // ── Role-protected endpoints ──────────────────────
                        // FREELANCER only
                        .requestMatchers(HttpMethod.POST,   "/proposal/AddProposal").hasAuthority("FREELANCER")
                        .requestMatchers(HttpMethod.PUT,    "/proposal/UpdateProposal/**").hasAuthority("FREELANCER")
                        .requestMatchers(HttpMethod.DELETE, "/proposal/DeleteProposal/**").hasAuthority("FREELANCER")
                        .requestMatchers(HttpMethod.POST,   "/proposal/ai-cover-letter").hasAuthority("FREELANCER")
                        .requestMatchers(HttpMethod.PUT,    "/proposal/*/counter-offer/accept").hasAuthority("FREELANCER")
                        .requestMatchers(HttpMethod.PUT,    "/proposal/*/counter-offer/reject").hasAuthority("FREELANCER")
                        // CLIENT only
                        .requestMatchers(HttpMethod.POST,   "/proposal/Accept/**").hasAuthority("CLIENT")
                        .requestMatchers(HttpMethod.POST,   "/proposal/*/counter-offer").hasAuthority("CLIENT")
                        // Everything else requires at least a valid token
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}