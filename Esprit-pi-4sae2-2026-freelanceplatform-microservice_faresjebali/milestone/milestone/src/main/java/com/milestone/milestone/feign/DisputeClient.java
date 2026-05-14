package com.milestone.milestone.feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@FeignClient(name = "dispute-service", url = "${dispute.service.url}")
public interface DisputeClient {

    @GetMapping("/api/disputes/blocking")
    Map<String, Boolean> hasBlockingDispute(@RequestParam("contractId") Long contractId);
}