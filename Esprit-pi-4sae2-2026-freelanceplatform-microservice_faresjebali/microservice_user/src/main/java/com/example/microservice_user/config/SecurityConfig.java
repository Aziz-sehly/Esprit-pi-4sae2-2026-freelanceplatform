package com.example.microservice_user.config;

import com.example.microservice_user.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.util.matcher.RequestMatcher;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final UserDetailsService userDetailsService;

    /**
     * Servlet path matching alone can miss real URIs behind the gateway / forwarded headers.
     * This matches the same paths the app exposes, with or without a leading /microservice-user segment.
     */
    private static final RequestMatcher PUBLIC_NO_AUTH = SecurityConfig::isPublicWithoutAuthentication;

    private static final RequestMatcher ADMIN_API = SecurityConfig::isAdminApiPath;

    private static String pathForAuthorization(HttpServletRequest request) {
        String p = request.getRequestURI();
        String ctx = request.getContextPath();
        if (ctx != null && !ctx.isEmpty() && p.startsWith(ctx)) {
            p = p.substring(ctx.length());
        }
        return p.isEmpty() ? "/" : p;
    }

    private static boolean isPublicWithoutAuthentication(HttpServletRequest request) {
        String p = pathForAuthorization(request);
        return p.startsWith("/api/auth/")
                || p.startsWith("/microservice-user/api/auth/")
                || p.startsWith("/api/users/public/")
                || p.startsWith("/microservice-user/api/users/public/")
                || p.startsWith("/actuator/")
                || p.startsWith("/microservice-user/actuator/")
                // Boot forwards failed requests to /error — must be anonymous or failures look like "403 Forbidden"
                || p.equals("/error")
                || p.startsWith("/error/");
    }

    private static boolean isAdminApiPath(HttpServletRequest request) {
        String p = pathForAuthorization(request);
        return p.startsWith("/api/admin/") || p.startsWith("/microservice-user/api/admin/");
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(AbstractHttpConfigurer::disable)  // CORS disabled - handled by Gateway
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(PUBLIC_NO_AUTH).permitAll()
                        .requestMatchers(ADMIN_API).hasAuthority("ADMIN")
                        .anyRequest().authenticated()
                )
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}