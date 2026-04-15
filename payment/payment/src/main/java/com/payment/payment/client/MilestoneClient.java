package com.payment.payment.client;

import com.payment.payment.dto.ContractSummary;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;

@FeignClient(name = "milestone-service")
public interface MilestoneClient {

    @GetMapping("/milestone/api/contracts/{id}")
    ContractSummary getContract(@PathVariable("id") Long id, @RequestHeader("Authorization") String authorization);

    @PostMapping("/milestone/api/{id}/mark-funded")
    @CrossOrigin
    void markFunded(@PathVariable("id") Long id);

    @PostMapping("/milestone/api/{id}/mark-paid")
    @CrossOrigin
    void markPaid(@PathVariable("id") Long id);
}
