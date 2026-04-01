package com.esprit.microservice_proposal.Feign;

import com.esprit.microservice_proposal.DTO.User;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "microservice-user", url = "http://localhost:8080")
public interface UserClient {

    @GetMapping("/user/GetUser/{id}")
    User getUserById(@PathVariable("id") int id);
}