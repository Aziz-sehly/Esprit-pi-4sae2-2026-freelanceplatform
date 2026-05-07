package com.example.microservice_contract.feign;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "microservice-user-contract", url = "http://localhost:8084")
public interface UserClient {

    @GetMapping("/api/users/public/{id}")
    UserData getUserById(@PathVariable("id") Long id);

    @Data @NoArgsConstructor @AllArgsConstructor
    class UserData {
        private Long   id;
        private String email;
        private String firstName;
        private String lastName;
        private String role;

        public String getFullName() {
            if (firstName != null && lastName != null) return firstName + " " + lastName;
            return "User " + id;
        }
    }
}