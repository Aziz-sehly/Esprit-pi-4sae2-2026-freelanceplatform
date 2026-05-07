package com.example.microservice_service.client;

import com.example.microservice_service.dto.UserResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

// gateway.url=http://localhost:8085 is set in application.properties, so
// the url resolves correctly to http://localhost:8085/microservice-user
// FeignClientConfig must NOT have @Configuration (see that file)
@FeignClient(
        name = "microservice-user",
        url = "${gateway.url}/microservice-user",
        configuration = FeignClientConfig.class,
        fallbackFactory = UserClientFallbackFactory.class
)
public interface UserClient {

    @GetMapping("/api/users/public/{id}")
    UserResponse getUserById(@PathVariable Long id);

    @GetMapping("/api/users/public/email/{email}")
    UserResponse getUserByEmail(@PathVariable String email);
}