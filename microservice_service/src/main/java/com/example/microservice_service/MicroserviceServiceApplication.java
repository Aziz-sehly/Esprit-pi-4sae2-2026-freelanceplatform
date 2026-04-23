package com.example.microservice_service;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableFeignClients
public class MicroserviceServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(MicroserviceServiceApplication.class, args);
    }
}
