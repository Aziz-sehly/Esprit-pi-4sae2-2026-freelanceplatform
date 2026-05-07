package com.milestone.milestone.client;

import com.milestone.milestone.dto.UserSummary;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "microservice-user")
public interface UserClient {

    @GetMapping("/api/users/public/{id}")
    UserSummary getUserById(@PathVariable("id") Long id);
}
