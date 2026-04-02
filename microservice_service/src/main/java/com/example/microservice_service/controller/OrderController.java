package com.example.microservice_service.controller;

import com.example.microservice_service.entity.Order;
import com.example.microservice_service.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    public ResponseEntity<Order> createOrder(@RequestBody Order order) {
        return ResponseEntity.status(HttpStatus.CREATED).body(orderService.createOrder(order));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Order> getOrderById(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getOrderById(id));
    }

    @GetMapping("/buyer/{buyerId}")
    public ResponseEntity<List<Order>> getOrdersByBuyer(@PathVariable Long buyerId) {
        return ResponseEntity.ok(orderService.getOrdersByBuyer(buyerId));
    }

    @GetMapping("/seller/{sellerId}")
    public ResponseEntity<List<Order>> getOrdersBySeller(@PathVariable Long sellerId) {
        return ResponseEntity.ok(orderService.getOrdersBySeller(sellerId));
    }

    @GetMapping("/service/{serviceId}")
    public ResponseEntity<List<Order>> getOrdersByService(@PathVariable Long serviceId) {
        return ResponseEntity.ok(orderService.getOrdersByService(serviceId));
    }

    @PatchMapping("/{id}/requirements")
    public ResponseEntity<Order> submitRequirements(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(orderService.submitRequirements(id, body.get("requirementsAnswer")));
    }

    @PatchMapping("/{id}/deliver")
    public ResponseEntity<Order> deliverOrder(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(orderService.deliverOrder(
                id,
                body.get("deliveryMessage"),
                body.get("deliveryFileUrls")));
    }

    @PatchMapping("/{id}/revision")
    public ResponseEntity<Order> requestRevision(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(orderService.requestRevision(id, body.get("revisionNotes")));
    }

    @PatchMapping("/{id}/complete")
    public ResponseEntity<Order> completeOrder(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.completeOrder(id));
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<Order> cancelOrder(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.cancelOrder(id));
    }

    @PatchMapping("/{id}/dispute")
    public ResponseEntity<Order> disputeOrder(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.disputeOrder(id));
    }
}
