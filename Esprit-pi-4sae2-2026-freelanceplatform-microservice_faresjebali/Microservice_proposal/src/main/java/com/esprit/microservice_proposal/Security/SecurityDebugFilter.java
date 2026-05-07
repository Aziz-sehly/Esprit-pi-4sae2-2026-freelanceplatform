package com.esprit.microservice_proposal.Security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class SecurityDebugFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        // Let the request proceed first
        filterChain.doFilter(request, response);

        // Then check what happened to security context
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        System.out.println(">>> [SecurityDebugFilter] AFTER request processing:");
        System.out.println("    URI: " + request.getRequestURI());
        System.out.println("    Response status: " + response.getStatus());
        System.out.println("    Authentication: " + (auth != null ? "PRESENT" : "NULL"));

        if (auth != null) {
            System.out.println("    Principal: " + auth.getPrincipal());
            System.out.println("    Authorities: " + auth.getAuthorities());
        }
    }
}