package com.example.microservice_service.controller;

import com.example.microservice_service.entity.CustomOffer;
import com.example.microservice_service.service.CustomOfferService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/custom-offers")
@RequiredArgsConstructor
public class CustomOfferController {

    private final CustomOfferService customOfferService;

    @PostMapping
    public ResponseEntity<CustomOffer> createOffer(@RequestBody CustomOffer offer) {
        return ResponseEntity.status(HttpStatus.CREATED).body(customOfferService.createOffer(offer));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CustomOffer> getOfferById(@PathVariable Long id) {
        return ResponseEntity.ok(customOfferService.getOfferById(id));
    }

    @GetMapping("/sender/{senderId}")
    public ResponseEntity<List<CustomOffer>> getOffersBySender(@PathVariable Long senderId) {
        return ResponseEntity.ok(customOfferService.getOffersBySender(senderId));
    }

    @GetMapping("/receiver/{receiverId}")
    public ResponseEntity<List<CustomOffer>> getOffersByReceiver(@PathVariable Long receiverId) {
        return ResponseEntity.ok(customOfferService.getOffersByReceiver(receiverId));
    }

    @GetMapping("/receiver/{receiverId}/pending")
    public ResponseEntity<List<CustomOffer>> getPendingOffersForReceiver(@PathVariable Long receiverId) {
        return ResponseEntity.ok(customOfferService.getPendingOffersForReceiver(receiverId));
    }

    @PatchMapping("/{id}/accept")
    public ResponseEntity<CustomOffer> acceptOffer(@PathVariable Long id) {
        return ResponseEntity.ok(customOfferService.acceptOffer(id));
    }

    @PatchMapping("/{id}/decline")
    public ResponseEntity<CustomOffer> declineOffer(@PathVariable Long id) {
        return ResponseEntity.ok(customOfferService.declineOffer(id));
    }

    @PatchMapping("/{id}/expire")
    public ResponseEntity<CustomOffer> expireOffer(@PathVariable Long id) {
        return ResponseEntity.ok(customOfferService.expireOffer(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteOffer(@PathVariable Long id) {
        customOfferService.deleteOffer(id);
        return ResponseEntity.noContent().build();
    }
}
