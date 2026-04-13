package com.esprit.microservice_proposal.Feign;

import com.esprit.microservice_proposal.DTO.User;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "microservice-user", url = "http://localhost:8084")
public interface UserClient {

    @GetMapping("/api/users/public/{id}")
    User getUserById(@PathVariable("id") Long id);
}