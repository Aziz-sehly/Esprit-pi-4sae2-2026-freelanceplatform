package com.esprit.eurikaregister;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.server.EnableEurekaServer;

@SpringBootApplication
@EnableEurekaServer
public class EurikaRegisterApplication {

    public static void main(String[] args) {
        SpringApplication.run(EurikaRegisterApplication.class, args);
    }

}
