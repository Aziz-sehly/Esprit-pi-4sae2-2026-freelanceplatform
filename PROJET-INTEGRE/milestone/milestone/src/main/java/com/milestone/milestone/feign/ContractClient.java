package com.milestone.milestone.feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@FeignClient(name = "microservice-contract", url = "${contract.service.url}",configuration = FeignClientConfig.class)

public interface ContractClient {

    @GetMapping("/api/contracts/{id}")
    ContractDto getById(@PathVariable("id") Long id);

    record ContractDto(
            Long id,
            Long clientId,
            Long freelancerId,
            String clientName,
            String freelancerName,
            BigDecimal amount,
            String paymentStructure,
            String status,
            LocalDateTime startDate,
            LocalDateTime endDate
    ) {}
}