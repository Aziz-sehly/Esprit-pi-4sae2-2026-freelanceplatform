package com.example.microservice_service.client;

import feign.RequestInterceptor;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpServletRequest;

// ✅ DO NOT add @Configuration here — if this class is picked up by component scan
// globally, it will register the RequestInterceptor for ALL Feign clients, causing
// bean conflicts and potential circular dependency issues.
// Spring's @FeignClient(configuration = FeignClientConfig.class) handles instantiation.
public class FeignClientConfig {

    public RequestInterceptor requestInterceptor() {
        return requestTemplate -> {
            ServletRequestAttributes attributes =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();

            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
                String authHeader = request.getHeader("Authorization");
                if (authHeader != null && !authHeader.isEmpty()) {
                    requestTemplate.header("Authorization", authHeader);
                }
            }
        };
    }
}