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
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.context.SecurityContextHolderStrategy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        System.out.println(">>> [SecurityConfig] Initializing Security Filter Chain");
        System.out.println(">>> [SecurityConfig] JwtAuthFilter injected: " + (jwtAuthFilter != null ? "YES" : "NO"));

        // CRITICAL: Use MODE_INHERITABLETHREADLOCAL to propagate context across threads
        SecurityContextHolder.setStrategyName(SecurityContextHolder.MODE_INHERITABLETHREADLOCAL);
        System.out.println(">>> [SecurityConfig] Set SecurityContextHolder strategy to MODE_INHERITABLETHREADLOCAL");

        http
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(s -> {
                    s.sessionCreationPolicy(SessionCreationPolicy.STATELESS);
                    System.out.println(">>> [SecurityConfig] Session management: STATELESS");
                })
                .authorizeHttpRequests(auth -> {
                    System.out.println(">>> [SecurityConfig] Configuring authorization rules...");

                    // CORS preflight
                    auth.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll();
                    System.out.println("    - OPTIONS /** -> permitAll");

                    // Error endpoint
                    auth.requestMatchers("/error").permitAll();
                    System.out.println("    - /error -> permitAll");

                    // ── Public ────────────────────────────────────────
                    auth.requestMatchers("/proposal/GetAllProposals").permitAll();
                    auth.requestMatchers("/proposal/GetProposal/**").permitAll();
                    auth.requestMatchers("/proposal/GetProposalsByProject/**").permitAll();
                    auth.requestMatchers("/proposal/GetProposalsByFreelancer/**").permitAll();
                    auth.requestMatchers("/proposal/GetProject/**").permitAll();
                    auth.requestMatchers("/proposal/GetFreelancer/**").permitAll();
                    auth.requestMatchers("/proposal/GetAllProjects").permitAll();
                    auth.requestMatchers("/proposal/ranked/**").permitAll();
                    auth.requestMatchers("/proposal/stats/**").permitAll();
                    auth.requestMatchers("/actuator/**").permitAll();
                    System.out.println("    - Public GET endpoints -> permitAll");

                    // ── FREELANCER ────────────────────────────────────
                    auth.requestMatchers(HttpMethod.POST, "/proposal/AddProposal").hasAuthority("FREELANCER");
                    System.out.println("    - POST /proposal/AddProposal -> hasAuthority('FREELANCER')");

                    auth.requestMatchers(HttpMethod.PUT, "/proposal/UpdateProposal/**").hasAuthority("FREELANCER");
                    System.out.println("    - PUT /proposal/UpdateProposal/** -> hasAuthority('FREELANCER')");

                    auth.requestMatchers(HttpMethod.DELETE, "/proposal/DeleteProposal/**").hasAuthority("FREELANCER");
                    System.out.println("    - DELETE /proposal/DeleteProposal/** -> hasAuthority('FREELANCER')");

                    auth.requestMatchers(HttpMethod.POST, "/proposal/ai-cover-letter").hasAuthority("FREELANCER");
                    System.out.println("    - POST /proposal/ai-cover-letter -> hasAuthority('FREELANCER')");

                    auth.requestMatchers(HttpMethod.PUT, "/proposal/*/counter-offer/accept").hasAuthority("FREELANCER");
                    auth.requestMatchers(HttpMethod.PUT, "/proposal/*/counter-offer/reject").hasAuthority("FREELANCER");
                    System.out.println("    - PUT /proposal/*/counter-offer/{accept|reject} -> hasAuthority('FREELANCER')");

                    // ── CLIENT ────────────────────────────────────────
                    auth.requestMatchers(HttpMethod.POST, "/proposal/Accept/**").hasAuthority("CLIENT");
                    System.out.println("    - POST /proposal/Accept/** -> hasAuthority('CLIENT')");

                    auth.requestMatchers(HttpMethod.POST, "/proposal/Reject/**").hasAuthority("CLIENT");
                    System.out.println("    - POST /proposal/Reject/** -> hasAuthority('CLIENT')");

                    auth.requestMatchers(HttpMethod.POST, "/proposal/*/counter-offer").hasAuthority("CLIENT");
                    System.out.println("    - POST /proposal/*/counter-offer -> hasAuthority('CLIENT')");

                    // ── Authenticated ─────────────────────────────────
                    auth.anyRequest().authenticated();
                    System.out.println("    - anyRequest -> authenticated");
                })
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterAfter(new PostAuthDebugFilter(), JwtAuthFilter.class);

        System.out.println(">>> [SecurityConfig] Filter chain configured:");
        System.out.println("    Order: JwtAuthFilter -> PostAuthDebugFilter -> UsernamePasswordAuthenticationFilter");

        return http.build();
    }

    /**
     * Debug filter that runs AFTER JwtAuthFilter to verify authentication state
     * before it reaches the @PreAuthorize annotations
     */
    public static class PostAuthDebugFilter extends OncePerRequestFilter {

        @Override
        protected void doFilterInternal(HttpServletRequest request,
                                        HttpServletResponse response,
                                        FilterChain filterChain)
                throws ServletException, IOException {

            String uri = request.getRequestURI();
            String method = request.getMethod();

            System.out.println(">>> [PostAuthDebugFilter] BEFORE controller - " + method + " " + uri);

            // CRITICAL: Check if we're on a different thread
            System.out.println(">>> [PostAuthDebugFilter] Current thread: " + Thread.currentThread().getName());

            Authentication auth = SecurityContextHolder.getContext().getAuthentication();

            if (auth == null) {
                System.out.println(">>> [PostAuthDebugFilter] ⚠️  AUTHENTICATION IS NULL!");
                System.out.println(">>> [PostAuthDebugFilter] Checking if context was cleared by async processing");

                // Try to check if there's a context from the request attribute (fallback)
                Object userId = request.getAttribute("userId");
                Object role = request.getAttribute("role");

                if (userId != null && role != null) {
                    System.out.println(">>> [PostAuthDebugFilter] Found request attributes - can reconstruct auth!");
                    System.out.println("    userId from attribute: " + userId);
                    System.out.println("    role from attribute: " + role);

                    // RECONSTRUCT authentication from request attributes
                    var authorities = java.util.List.of(
                            new org.springframework.security.core.authority.SimpleGrantedAuthority(role.toString())
                    );
                    var newAuth = new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                            request.getAttribute("email"), null, authorities
                    );
                    SecurityContextHolder.getContext().setAuthentication(newAuth);
                    System.out.println(">>> [PostAuthDebugFilter] ✅ Reconstructed authentication from request attributes");
                    auth = newAuth;
                } else {
                    System.out.println(">>> [PostAuthDebugFilter] This will cause 403 on protected endpoints");
                }
            } else {
                System.out.println(">>> [PostAuthDebugFilter] ✅ Authentication present:");
                System.out.println("    Principal: " + auth.getPrincipal());
                System.out.println("    Name: " + auth.getName());
                System.out.println("    Authorities: " + auth.getAuthorities());
                System.out.println("    IsAuthenticated: " + auth.isAuthenticated());

                // Check specifically for FREELANCER authority
                boolean hasFreelancer = auth.getAuthorities().stream()
                        .anyMatch(a -> a.getAuthority().equals("FREELANCER"));
                boolean hasRoleFreelancer = auth.getAuthorities().stream()
                        .anyMatch(a -> a.getAuthority().equals("ROLE_FREELANCER"));

                System.out.println("    Has 'FREELANCER' authority: " + hasFreelancer);
                System.out.println("    Has 'ROLE_FREELANCER' authority: " + hasRoleFreelancer);

                if (!hasFreelancer && !hasRoleFreelancer) {
                    System.out.println(">>> [PostAuthDebugFilter] ⚠️  WARNING: Neither FREELANCER nor ROLE_FREELANCER found!");
                    System.out.println(">>> [PostAuthDebugFilter] This will cause 403 for FREELANCER-only endpoints");
                }
            }

            // Continue the chain
            filterChain.doFilter(request, response);

            // Check response status after controller processing
            int status = response.getStatus();
            System.out.println(">>> [PostAuthDebugFilter] AFTER controller - Response status: " + status);

            if (status == 403) {
                System.out.println(">>> [PostAuthDebugFilter] 🚫 403 Forbidden returned!");
                if (auth != null) {
                    System.out.println("    Authentication was present but authorization failed");
                    System.out.println("    Likely cause: authority mismatch between token and @PreAuthorize/hasAuthority");
                } else {
                    System.out.println("    Authentication was null - filter chain rejected the request");
                }
            } else if (status == 401) {
                System.out.println(">>> [PostAuthDebugFilter] 🚫 401 Unauthorized returned");
            } else if (status >= 200 && status < 300) {
                System.out.println(">>> [PostAuthDebugFilter] ✅ Success (" + status + ")");
            }
        }
    }
}