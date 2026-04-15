package org.example.forumservice.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Component
public class UserServiceClient {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${user-service.url}")
    private String userServiceUrl;

    /**
     * Calls GET /api/users/public/{id} on the User Service and returns
     * the user's full name as "FirstName LastName".
     * Falls back to "User #<id>" if the call fails for any reason.
     */
    public String getUserFullName(Long userId) {
        try {
            String url = userServiceUrl + "/api/users/public/" + userId;
            @SuppressWarnings("unchecked")
            Map<String, Object> user = restTemplate.getForObject(url, Map.class);
            if (user != null) {
                String firstName = (String) user.getOrDefault("firstName", "");
                String lastName  = (String) user.getOrDefault("lastName", "");
                return (firstName + " " + lastName).trim();
            }
        } catch (Exception e) {
            // User Service is down or userId doesn't exist — use fallback
        }
        return "User #" + userId;
    }
}