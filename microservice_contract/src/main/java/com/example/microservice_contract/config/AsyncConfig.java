package com.example.microservice_contract.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

@Configuration
@EnableAsync  // This enables @Async to work anywhere in the app
public class AsyncConfig {

    @Bean(name = "emailTaskExecutor")
    public Executor emailTaskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();

        // Always keep 2 threads alive waiting for email tasks
        executor.setCorePoolSize(2);

        // Spin up to 5 threads if the queue is full
        executor.setMaxPoolSize(5);

        // Hold up to 100 tasks in the queue before rejecting
        executor.setQueueCapacity(100);

        // Name threads so you can spot them in logs/thread dumps
        executor.setThreadNamePrefix("email-async-");

        // On shutdown: wait up to 30s for in-flight emails to finish
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(30);

        executor.initialize();
        return executor;
    }
}