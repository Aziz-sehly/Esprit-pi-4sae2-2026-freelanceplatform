package com.prolance.message.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.prolance.message.dto.UserDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class KeycloakUserService {

    private static final Logger log = LoggerFactory.getLogger(KeycloakUserService.class);

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${keycloak.url:http://localhost:8180}")
    private String keycloakUrl;

    @Value("${keycloak.realm:prolance}")
    private String realm;

    @Value("${keycloak.admin.client-id:prolance-backend}")
    private String clientId;

    @Value("${keycloak.admin.client-secret:}")
    private String clientSecret;

    @Value("${keycloak.admin.enabled:false}")
    private boolean enabled;

    public List<UserDto> getKeycloakUsers(Long excludeNumericId) {
        if (!enabled || clientSecret == null || clientSecret.isBlank()) {
            log.debug("Keycloak admin disabled or missing client-secret, returning empty list");
            return List.of();
        }
        try {
            String token = obtainAdminToken();
            if (token == null) return List.of();

            String url = keycloakUrl + "/admin/realms/" + realm + "/users";
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(token);
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);
            if (response.getStatusCode() != HttpStatus.OK || response.getBody() == null) {
                return List.of();
            }

            JsonNode users = objectMapper.readTree(response.getBody());
            List<UserDto> result = new ArrayList<>();
            for (JsonNode user : users) {
                String id = user.has("id") ? user.get("id").asText() : null;
                if (id == null) continue;

                Long numericId = UserDto.keycloakSubToNumericId(id);
                if (excludeNumericId != null && numericId.equals(excludeNumericId)) continue;

                String username = user.has("username") ? user.get("username").asText(null) : null;
                String email = user.has("email") ? user.get("email").asText(null) : null;
                String firstName = user.has("firstName") ? user.get("firstName").asText(null) : null;
                String lastName = user.has("lastName") ? user.get("lastName").asText(null) : null;

                result.add(new UserDto(numericId, username, email, firstName, lastName));
            }
            return result;
        } catch (Exception e) {
            log.warn("Failed to fetch Keycloak users: {}", e.getMessage());
            return List.of();
        }
    }

    /** Recherche d'utilisateurs par nom (username, firstName, lastName, email) - pour admin */
    public Set<Long> searchUserIdsByName(String searchTerm) {
        if (searchTerm == null || searchTerm.isBlank()) return Set.of();
        if (!enabled || clientSecret == null || clientSecret.isBlank()) return Set.of();
        try {
            String token = obtainAdminToken();
            if (token == null) return Set.of();

            String url = keycloakUrl + "/admin/realms/" + realm + "/users?search=" + java.net.URLEncoder.encode(searchTerm.trim(), java.nio.charset.StandardCharsets.UTF_8);
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(token);
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);
            if (response.getStatusCode() != HttpStatus.OK || response.getBody() == null) return Set.of();

            JsonNode users = objectMapper.readTree(response.getBody());
            Set<Long> ids = new HashSet<>();
            for (JsonNode user : users) {
                String id = user.has("id") ? user.get("id").asText() : null;
                if (id != null) {
                    ids.add(UserDto.keycloakSubToNumericId(id));
                }
            }
            return ids;
        } catch (Exception e) {
            log.warn("Failed to search Keycloak users: {}", e.getMessage());
            return Set.of();
        }
    }

    private String obtainAdminToken() {
        try {
            String url = keycloakUrl + "/realms/" + realm + "/protocol/openid-connect/token";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("client_id", clientId);
            body.add("client_secret", clientSecret);
            body.add("grant_type", "client_credentials");
            HttpEntity<MultiValueMap<String, String>> entity = new HttpEntity<>(body, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
            if (response.getStatusCode() != HttpStatus.OK || response.getBody() == null) return null;

            JsonNode json = objectMapper.readTree(response.getBody());
            return json.has("access_token") ? json.get("access_token").asText() : null;
        } catch (Exception e) {
            log.warn("Failed to obtain Keycloak admin token: {}", e.getMessage());
            return null;
        }
    }
}
