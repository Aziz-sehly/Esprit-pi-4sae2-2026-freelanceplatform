package com.example.microservice_contract;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableDiscoveryClient
@EnableFeignClients(basePackages = "com.example.microservice_contract.feign")
public class MicroserviceContractApplication {

    public static void main(String[] args) {
        SpringApplication.run(MicroserviceContractApplication.class, args);
    }

}