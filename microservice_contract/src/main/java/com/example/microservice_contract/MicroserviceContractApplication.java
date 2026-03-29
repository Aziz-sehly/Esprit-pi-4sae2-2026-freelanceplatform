package com.example.microservice_contract;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
public class MicroserviceContractApplication {

    public static void main(String[] args) {
        SpringApplication.run(MicroserviceContractApplication.class, args);
    }

}