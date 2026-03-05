package org.example.gatewayservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

// @SpringBootApplication marks this as the entry point of the Gateway application
@SpringBootApplication

// @EnableDiscoveryClient registers this Gateway with Eureka so it can
// look up the other services (Reviews, Forum) by name instead of hardcoded IP addresses
@EnableDiscoveryClient
public class GatewayServiceApplication {

    // Entry point — starts the Gateway application
    public static void main(String[] args) {
        SpringApplication.run(GatewayServiceApplication.class, args);
    }
}