package com.prolance.message.service;

import com.prolance.message.dto.UserDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Set;

@Service
public class UserDirectoryService {

    private static final Logger log = LoggerFactory.getLogger(UserDirectoryService.class);

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${app.user-service.base-url:http://localhost:8084/api/users}")
    private String userServiceBaseUrl;

    public List<UserDto> getUsers(Long excludeUserId) {
        try {
            String url = userServiceBaseUrl + "/internal/list";
            if (excludeUserId != null) url += "?excludeUserId=" + excludeUserId;
            ResponseEntity<List<UserDto>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<>() {}
            );
            return response.getBody() != null ? response.getBody() : List.of();
        } catch (Exception e) {
            log.warn("Failed to fetch users from user-service: {}", e.getMessage());
            return List.of();
        }
    }

    public Set<Long> searchUserIdsByName(String searchTerm) {
        if (searchTerm == null || searchTerm.isBlank()) return Set.of();
        try {
            String encoded = URLEncoder.encode(searchTerm.trim(), StandardCharsets.UTF_8);
            String url = userServiceBaseUrl + "/internal/search-ids?query=" + encoded;
            ResponseEntity<Set<Long>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<>() {}
            );
            return response.getBody() != null ? response.getBody() : Set.of();
        } catch (Exception e) {
            log.warn("Failed to search users in user-service: {}", e.getMessage());
            return Set.of();
        }
    }
}
