package com.prolance.dispute.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.web.SecurityFilterChain;

import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Value("${app.jwt.secret:404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970}")
    private String jwtSecret;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/actuator/**", "/health", "/info").permitAll()
                        // Appels inter-services (milestone / paiement) — à restreindre au réseau interne en prod
                        .requestMatchers("/api/disputes/blocking").permitAll()
                        .requestMatchers("/api/disputes/admin/**", "/api/disputes/admin").hasRole("ADMIN")
                        .requestMatchers("/api/disputes/*/insights").hasRole("ADMIN")
                        .requestMatchers("/api/disputes/**").authenticated()
                        .anyRequest().permitAll()
                )
                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter())))
                .build();
    }

    @Bean
    public JwtDecoder jwtDecoder() {
        return NimbusJwtDecoder.withSecretKey(resolveSigningKey(jwtSecret)).build();
    }

    /** Même logique que {@code microservice_user.JwtService#getSignInKey()}. */
    private static SecretKey resolveSigningKey(String raw) {
        String s = raw == null ? "" : raw.trim();
        try {
            return Keys.hmacShaKeyFor(Decoders.BASE64.decode(s));
        } catch (IllegalArgumentException ex) {
            return new SecretKeySpec(s.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        }
    }

    private Converter<Jwt, JwtAuthenticationToken> jwtAuthenticationConverter() {
        return jwt -> {
            List<String> roles = jwt.getClaimAsStringList("roles");
            List<String> effective = new ArrayList<>();
            if (roles != null) {
                effective.addAll(roles);
            }
            if (effective.isEmpty()) {
                String single = jwt.getClaimAsString("role");
                if (single != null && !single.isBlank()) {
                    effective.add(single);
                }
            }
            Collection<GrantedAuthority> authorities = effective.stream()
                    .map(role -> role.startsWith("ROLE_") ? role : "ROLE_" + role)
                    .map(SimpleGrantedAuthority::new)
                    .collect(Collectors.toList());
            return new JwtAuthenticationToken(jwt, authorities, jwt.getSubject());
        };
    }
}
