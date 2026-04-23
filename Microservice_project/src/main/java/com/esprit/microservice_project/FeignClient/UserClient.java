package com.esprit.microservice_project.FeignClient;

import com.esprit.microservice_project.DTO.User;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "microservice-user", url = "http://localhost:8084")
public interface UserClient {

    @GetMapping("/freelance/user/{id}/exists")
    boolean userExists(@PathVariable("id") int id);

    @GetMapping("/freelance/user/{id}")
    User getUserById(@PathVariable("id") int id);
}