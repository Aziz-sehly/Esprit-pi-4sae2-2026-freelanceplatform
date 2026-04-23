package com.example.microservice_service.client;

import com.example.microservice_service.dto.UserResponse;
import org.springframework.cloud.openfeign.FallbackFactory;
import org.springframework.stereotype.Component;

@Component
public class UserClientFallbackFactory implements FallbackFactory<UserClient> {

    @Override
    public UserClient create(Throwable cause) {
        return new UserClient() {
            @Override
            public UserResponse getUserById(Long id) {
                throw new RuntimeException(
                        "User service unavailable — could not fetch user with id: " + id
                                + ". Cause: " + cause.getMessage(), cause
                );
            }

            @Override
            public UserResponse getUserByEmail(String email) {
                throw new RuntimeException(
                        "User service unavailable — could not fetch user with email: " + email
                                + ". Cause: " + cause.getMessage(), cause
                );
            }
        };
    }
}