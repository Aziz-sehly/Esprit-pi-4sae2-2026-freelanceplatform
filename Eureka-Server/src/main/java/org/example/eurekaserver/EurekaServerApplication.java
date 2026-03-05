package org.example.eurekaserver;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.server.EnableEurekaServer;

// @SpringBootApplication tells Spring Boot: "this is the starting point of the application"
// It automatically sets up everything the app needs to run
@SpringBootApplication

// @EnableEurekaServer is what actually turns this app into a Service Registry.
// A Service Registry is like a phone book: when the Forum Service or Reviews Service start up,
// they "register" themselves here. The Gateway uses this registry to know where to forward requests.
@EnableEurekaServer
public class EurekaServerApplication {

    // This is the main method — the very first thing that runs when you start the app.
    // SpringApplication.run() boots up the entire Spring application.
    public static void main(String[] args) {
        SpringApplication.run(EurekaServerApplication.class, args);
    }
}