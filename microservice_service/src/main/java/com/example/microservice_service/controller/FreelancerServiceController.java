package com.example.microservice_service.controller;

import com.example.microservice_service.entity.FreelancerService;
import com.example.microservice_service.service.FreelancerServiceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/services")
@RequiredArgsConstructor
public class FreelancerServiceController {

    private final FreelancerServiceService serviceService;

    @PostMapping("/shop/{shopId}")
    public ResponseEntity<FreelancerService> createService(
            @PathVariable Long shopId,
            @RequestBody FreelancerService service) {
        return ResponseEntity.status(HttpStatus.CREATED).body(serviceService.createService(shopId, service));
    }

    @GetMapping
    public ResponseEntity<List<FreelancerService>> getActiveServices() {
        return ResponseEntity.ok(serviceService.getActiveServices());
    }

    @GetMapping("/pending")
    public ResponseEntity<List<FreelancerService>> getPendingServices() {
        return ResponseEntity.ok(serviceService.getPendingServices());
    }

    @GetMapping("/{id}")
    public ResponseEntity<FreelancerService> getServiceById(@PathVariable Long id) {
        return ResponseEntity.ok(serviceService.getServiceById(id));
    }

    @GetMapping("/slug/{slug}")
    public ResponseEntity<FreelancerService> getServiceBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(serviceService.getServiceBySlug(slug));
    }

    @GetMapping("/shop/{shopId}")
    public ResponseEntity<List<FreelancerService>> getServicesByShop(@PathVariable Long shopId) {
        return ResponseEntity.ok(serviceService.getServicesByShop(shopId));
    }

    @GetMapping("/category/{category}")
    public ResponseEntity<List<FreelancerService>> getServicesByCategory(@PathVariable String category) {
        return ResponseEntity.ok(serviceService.getActiveServicesByCategory(category));
    }

    @PutMapping("/{id}")
    public ResponseEntity<FreelancerService> updateService(
            @PathVariable Long id,
            @RequestBody FreelancerService service) {
        return ResponseEntity.ok(serviceService.updateService(id, service));
    }

    @PatchMapping("/{id}/submit")
    public ResponseEntity<FreelancerService> submitForReview(@PathVariable Long id) {
        return ResponseEntity.ok(serviceService.submitForReview(id));
    }

    @PatchMapping("/{id}/approve")
    public ResponseEntity<FreelancerService> approveService(@PathVariable Long id) {
        return ResponseEntity.ok(serviceService.approveService(id));
    }

    @PatchMapping("/{id}/reject")
    public ResponseEntity<FreelancerService> rejectService(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(serviceService.rejectService(id, body.get("reason")));
    }

    @PatchMapping("/{id}/toggle-pause")
    public ResponseEntity<FreelancerService> togglePause(@PathVariable Long id) {
        return ResponseEntity.ok(serviceService.togglePause(id));
    }

    @PatchMapping("/{id}/archive")
    public ResponseEntity<FreelancerService> archiveService(@PathVariable Long id) {
        return ResponseEntity.ok(serviceService.archiveService(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteService(@PathVariable Long id) {
        serviceService.deleteService(id);
        return ResponseEntity.noContent().build();
    }
}
