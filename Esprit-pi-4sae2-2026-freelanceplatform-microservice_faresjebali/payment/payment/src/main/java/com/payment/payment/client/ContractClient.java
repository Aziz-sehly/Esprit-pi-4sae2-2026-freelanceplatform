package com.payment.payment.client;

import com.payment.payment.dto.ContractSummary;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;

@FeignClient(name = "microservice-contract")
public interface ContractClient {

    @GetMapping("/api/contracts/{id}")
    ContractSummary getContract(
            @PathVariable("id") Long id,
            @RequestHeader("Authorization") String authorization
    );
}