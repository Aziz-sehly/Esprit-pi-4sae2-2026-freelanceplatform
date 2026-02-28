package com.esprit.apigateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
@EnableDiscoveryClient
public class ApiGatewayApplication {

    public static void main(String[] args) {
        SpringApplication.run(ApiGatewayApplication.class, args);
    }

    @Bean
    public RouteLocator gatewayRoutes(RouteLocatorBuilder builder) {
        return builder.routes()
                .route("microservice_project", r -> r
                        .path("/project/**")  // ← Change le path pour éviter les conflits
                        .filters(f -> f.rewritePath(
                                "/project/(?<segment>.*)",
                                "/freelance/project/${segment}"
                        ))
                        .uri("http://localhost:8091"))
                .route("microservice-proposal", r -> r
                        .path("/proposal/**")
                        .filters(f -> f.rewritePath(
                                "/proposal/(?<segment>.*)",
                                "/freelance1/proposal/${segment}"
                        ))
                        .uri("http://localhost:8092"))
                .build();
    }
}