package com.esprit.microservice_project;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;


@SpringBootApplication
@EnableDiscoveryClient
class MicroserviceProjectApplication {

    public static void main(String[] args) {
        SpringApplication.run(MicroserviceProjectApplication.class, args);
    }

}
