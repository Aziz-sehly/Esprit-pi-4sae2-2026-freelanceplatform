package com.example.microservice_service.client;

import com.example.microservice_service.dto.UserResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "microservice-user", url = "${gateway.url}/microservice-user")
public interface UserClient {

    @GetMapping("/api/users/public/{id}")
    UserResponse getUserById(@PathVariable Long id);

    @GetMapping("/api/users/public/email/{email}")
    UserResponse getUserByEmail(@PathVariable String email);
}