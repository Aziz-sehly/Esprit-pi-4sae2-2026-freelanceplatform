package com.prolance.dispute.client;

import com.prolance.dispute.dto.MessageDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

@FeignClient(name = "message-service")
public interface MessageClient {

    @GetMapping("/api/messages/contracts/{contractId}")
    List<MessageDto> getMessagesByContractId(@PathVariable("contractId") Long contractId);
}
