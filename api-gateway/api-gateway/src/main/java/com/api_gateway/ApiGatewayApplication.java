package com.api_gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;



@EnableDiscoveryClient
@SpringBootApplication
public class ApiGatewayApplication {

	public static void main(String[] args) {
		SpringApplication.run(ApiGatewayApplication.class, args);
	}

	@Bean
	public RouteLocator gatewayRoutes(RouteLocatorBuilder builder) {
		return builder.routes()

				.route("user-route", r -> r
						.path("/user/**")
						.filters(f -> f.stripPrefix(1))
						.uri("lb://microservice-user"))

				.route("milestone-route", r -> r
						.path("/milestone/**")
						.uri("lb://milestone-service"))

				.route("payment-route", r -> r
						.path("/payment/**")
						.uri("lb://payment-service"))

				.build();
	}
}
