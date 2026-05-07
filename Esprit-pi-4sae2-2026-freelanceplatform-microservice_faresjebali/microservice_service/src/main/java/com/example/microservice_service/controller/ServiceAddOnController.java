package com.example.microservice_service.controller;

import com.example.microservice_service.entity.ServiceAddOn;
import com.example.microservice_service.service.ServiceAddOnService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/addons")
@RequiredArgsConstructor
public class ServiceAddOnController {

    private final ServiceAddOnService addOnService;

    @PostMapping("/service/{serviceId}")
    public ResponseEntity<ServiceAddOn> createAddOn(
            @PathVariable Long serviceId,
            @RequestBody ServiceAddOn addOn) {
        return ResponseEntity.status(HttpStatus.CREATED).body(addOnService.createAddOn(serviceId, addOn));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ServiceAddOn> getAddOnById(@PathVariable Long id) {
        return ResponseEntity.ok(addOnService.getAddOnById(id));
    }

    @GetMapping("/service/{serviceId}")
    public ResponseEntity<List<ServiceAddOn>> getAddOnsByService(@PathVariable Long serviceId) {
        return ResponseEntity.ok(addOnService.getAddOnsByService(serviceId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ServiceAddOn> updateAddOn(
            @PathVariable Long id,
            @RequestBody ServiceAddOn addOn) {
        return ResponseEntity.ok(addOnService.updateAddOn(id, addOn));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAddOn(@PathVariable Long id) {
        addOnService.deleteAddOn(id);
        return ResponseEntity.noContent().build();
    }
}
