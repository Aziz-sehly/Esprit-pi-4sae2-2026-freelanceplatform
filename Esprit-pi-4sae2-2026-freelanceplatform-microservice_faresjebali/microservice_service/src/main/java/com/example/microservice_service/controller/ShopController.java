package com.example.microservice_service.controller;

import com.example.microservice_service.dto.ShopRequest;
import com.example.microservice_service.entity.Shop;
import com.example.microservice_service.Security.JwtUtil;
import com.example.microservice_service.service.ShopService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/shops")
@RequiredArgsConstructor
public class ShopController {

    private final ShopService shopService;
    private final JwtUtil jwtUtil;

    @PostMapping
    public ResponseEntity<Shop> createShop(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody ShopRequest shopRequest) {      // ✅ use DTO, not raw Shop entity
        String token = authHeader.substring(7);
        Long userId = jwtUtil.extractUserId(token);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(shopService.createShop(userId, shopRequest));
    }

    @GetMapping
    public ResponseEntity<List<Shop>> getAllShops() {
        return ResponseEntity.ok(shopService.getAllShops());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Shop> getShopById(@PathVariable Long id) {
        Shop shop = shopService.getShopById(id);
        if (shop == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(shop);
    }

    @GetMapping("/freelancer/{freelancerId}")
    public ResponseEntity<Shop> getShopByFreelancer(@PathVariable Long freelancerId) {
        Shop shop = shopService.getShopByFreelancerId(freelancerId);
        if (shop == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(shop);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Shop> updateShop(
            @PathVariable Long id,
            @RequestBody ShopRequest shopRequest,        // ✅ use DTO, not raw Shop entity
            @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7);
        Long userId = jwtUtil.extractUserId(token);
        return ResponseEntity.ok(shopService.updateShop(id, shopRequest, userId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteShop(
            @PathVariable Long id,
            @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7);
        Long userId = jwtUtil.extractUserId(token);
        shopService.deleteShop(id, userId);
        return ResponseEntity.noContent().build();
    }
}