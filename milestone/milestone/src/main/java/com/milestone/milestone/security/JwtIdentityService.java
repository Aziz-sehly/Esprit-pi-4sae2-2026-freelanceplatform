package com.milestone.milestone.security;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Service
@RequiredArgsConstructor
public class JwtIdentityService {

    private final ObjectMapper objectMapper;

    public CurrentUser parseRequired(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            throw new IllegalStateException("Missing Authorization header");
        }

        try {
            String token = authorizationHeader.substring(7);
            String[] parts = token.split("\\.");
            String payload = new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8);
            JsonNode node = objectMapper.readTree(payload);
            return new CurrentUser(
                    node.path("userId").asLong(),
                    node.path("sub").asText(),
                    node.path("role").asText()
            );
        } catch (Exception ex) {
            throw new IllegalStateException("Invalid Authorization token");
        }
    }
}
