package com.example.microservice_contract.feign;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "microservice-proposal", url = "${proposal.service.url}")
public interface ProposalClient {

    @GetMapping("/proposal/GetProposal/{id}")
    ProposalData getProposal(@PathVariable("id") int id);

    @Data @NoArgsConstructor @AllArgsConstructor
    class ProposalData {
        private Integer id;
        private Integer projectId;
        private Integer freelancerId;
        private Integer clientId;        // may be null — depends on your Proposal entity
        private Float   proposedPrice;
        private Integer deliveryDays;
        private String  coverLetter;
        private String  status;
    }
}