package com.esprit.microservice_proposal;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableFeignClients
@EnableDiscoveryClient

public class MicroserviceProposalApplication {

    public static void main(String[] args) {
        SpringApplication.run(MicroserviceProposalApplication.class, args);
    }

}
