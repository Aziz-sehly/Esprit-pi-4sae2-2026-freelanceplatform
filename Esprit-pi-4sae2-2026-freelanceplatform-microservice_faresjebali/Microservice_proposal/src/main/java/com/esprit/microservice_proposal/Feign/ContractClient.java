package com.esprit.microservice_proposal.Feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "microservice-contract", url = "http://localhost:8083")
public interface ContractClient {

    @PostMapping(value = "/api/contracts", consumes = "application/json")
    ContractResponse createContract(@RequestBody ContractRequest request);
}