package com.esprit.microservice_proposal.Security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    private static final List<String> PUBLIC_PATHS = List.of(
            "/proposal/GetAllProposals",
            "/proposal/GetProposal/",
            "/proposal/GetProposalsByProject/",
            "/proposal/GetProposalsByFreelancer/",
            "/proposal/GetProject/",
            "/proposal/GetFreelancer/",
            "/proposal/GetAllProjects",
            "/proposal/ranked/",
            "/proposal/stats/",
            "/actuator/",
            "/error"
    );

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String uri = request.getRequestURI();
        String method = request.getMethod();

        // ── DEBUG: Log every incoming request ─────────────────────────────
        System.out.println(">>> [JwtAuthFilter] " + method + " " + uri);
        System.out.println(">>> [JwtAuthFilter] Headers: " +
                java.util.Collections.list(request.getHeaderNames()));

        // Handle CORS preflight (OPTIONS) - MUST allow these through
        if ("OPTIONS".equalsIgnoreCase(method)) {
            System.out.println(">>> [JwtAuthFilter] CORS preflight request - allowing through");
            filterChain.doFilter(request, response);
            return;
        }

        // Skip JWT parsing for public paths
        boolean isPublic = PUBLIC_PATHS.stream().anyMatch(uri::startsWith);
        System.out.println(">>> [JwtAuthFilter] Is public path: " + isPublic);

        if (isPublic) {
            System.out.println(">>> [JwtAuthFilter] Skipping auth for public path");
            filterChain.doFilter(request, response);
            return;
        }

        // Protected route — token is mandatory
        String authHeader = request.getHeader("Authorization");
        System.out.println(">>> [JwtAuthFilter] Auth header: " +
                (authHeader != null ? authHeader.substring(0, Math.min(50, authHeader.length())) + "..." : "NULL"));

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            System.out.println(">>> [JwtAuthFilter] REJECTING: Missing or invalid Authorization header");
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("Missing or invalid Authorization header");
            return;
        }

        try {
            String token = authHeader.substring(7);
            System.out.println(">>> [JwtAuthFilter] Token length: " + token.length());

            Claims claims = jwtUtil.extractAllClaims(token);
            System.out.println(">>> [JwtAuthFilter] JWT parsed successfully");

            Long userId  = claims.get("userId", Long.class);
            String role  = claims.get("role", String.class);
            String email = claims.getSubject();

            System.out.println(">>> [JwtAuthFilter] Raw claims from token:");
            System.out.println("    userId (raw): " + userId + " (type: " +
                    (userId != null ? userId.getClass().getSimpleName() : "null") + ")");
            System.out.println("    role (raw): " + role);
            System.out.println("    email (sub): " + email);

            // Uppercase the role
            String originalRole = role;
            if (role != null) {
                role = role.toUpperCase();
                System.out.println(">>> [JwtAuthFilter] Role uppercased: " + originalRole + " -> " + role);
            }

            // Validate role exists
            if (role == null || role.isBlank()) {
                System.out.println(">>> [JwtAuthFilter] REJECTING: Role is null or blank");
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.getWriter().write("Role missing from token");
                return;
            }

            // Set request attributes (for controller access)
            request.setAttribute("userId", userId);
            request.setAttribute("role", role);
            request.setAttribute("email", email);
            System.out.println(">>> [JwtAuthFilter] Request attributes set");

            // Create authority - CRITICAL: Check if we need ROLE_ prefix
            String authorityString = role;
            // Try with ROLE_ prefix if role doesn't have it (Spring Security convention)
            if (!role.startsWith("ROLE_")) {
                // We'll create the authority as-is first, but log both versions
                System.out.println(">>> [JwtAuthFilter] Role doesn't have ROLE_ prefix");
            }

            SimpleGrantedAuthority authority = new SimpleGrantedAuthority(authorityString);
            System.out.println(">>> [JwtAuthFilter] Created authority: " + authority.getAuthority());
            System.out.println(">>> [JwtAuthFilter] Authority class: " + authority.getClass().getSimpleName());

            // Create authentication token
            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            email,  // principal
                            null,   // credentials (none for JWT)
                            List.of(authority)  // authorities
                    );

            System.out.println(">>> [JwtAuthFilter] Authentication object created:");
            System.out.println("    Principal: " + authentication.getPrincipal());
            System.out.println("    Credentials: " + authentication.getCredentials());
            System.out.println("    Authorities: " + authentication.getAuthorities());
            System.out.println("    IsAuthenticated: " + authentication.isAuthenticated());

            // Set in SecurityContextHolder
            SecurityContextHolder.getContext().setAuthentication(authentication);

            // Verify it was set
            Authentication storedAuth = SecurityContextHolder.getContext().getAuthentication();
            System.out.println(">>> [JwtAuthFilter] Stored authentication in SecurityContext:");
            System.out.println("    Stored: " + (storedAuth != null ? "YES" : "NO"));
            if (storedAuth != null) {
                System.out.println("    Stored authorities: " + storedAuth.getAuthorities());
            }

            System.out.println(">>> [JwtAuthFilter] Authentication successful - proceeding to endpoint");

        } catch (JwtException e) {
            System.out.println(">>> [JwtAuthFilter] JWT ERROR: " + e.getClass().getSimpleName() + ": " + e.getMessage());
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("Invalid or expired token: " + e.getMessage());
            return;
        } catch (Exception e) {
            System.out.println(">>> [JwtAuthFilter] UNEXPECTED ERROR: " + e.getClass().getSimpleName() + ": " + e.getMessage());
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("Auth filter error: " + e.getMessage());
            return;
        }

        System.out.println(">>> [JwtAuthFilter] Proceeding with filter chain...");
        filterChain.doFilter(request, response);

        // Post-processing debug
        System.out.println(">>> [JwtAuthFilter] Filter chain completed for " + method + " " + uri);
    }
}