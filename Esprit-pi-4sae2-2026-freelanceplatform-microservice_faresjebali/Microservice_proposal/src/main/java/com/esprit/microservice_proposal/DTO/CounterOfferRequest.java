package com.esprit.microservice_proposal.DTO;

import lombok.Data;

@Data
public class CounterOfferRequest {
    private Float  counterPrice;
    private String message;
}