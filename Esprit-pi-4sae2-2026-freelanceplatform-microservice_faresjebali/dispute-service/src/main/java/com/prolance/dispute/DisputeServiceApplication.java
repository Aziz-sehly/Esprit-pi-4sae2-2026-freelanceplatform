package com.prolance.dispute;

import com.prolance.dispute.config.DisputeInsightsProperties;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.cloud.openfeign.EnableFeignClients;

@EnableFeignClients
@SpringBootApplication
@EnableScheduling
@EnableConfigurationProperties(DisputeInsightsProperties.class)
public class DisputeServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(DisputeServiceApplication.class, args);
    }
}
