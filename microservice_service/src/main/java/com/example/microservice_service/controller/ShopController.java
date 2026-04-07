package com.example.microservice_service.controller;

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

    // FREELANCER only
    @PostMapping
    public ResponseEntity<Shop> createShop(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Shop shop) {
        String token = authHeader.substring(7);
        Long userId = jwtUtil.extractUserId(token);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(shopService.createShop(userId, shop));
    }

    // Anyone authenticated
    @GetMapping
    public ResponseEntity<List<Shop>> getAllShops() {
        return ResponseEntity.ok(shopService.getAllShops());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Shop> getShopById(@PathVariable Long id) {
        return ResponseEntity.ok(shopService.getShopById(id));
    }

    @GetMapping("/freelancer/{freelancerId}")
    public ResponseEntity<Shop> getShopByFreelancer(@PathVariable Long freelancerId) {
        return ResponseEntity.ok(shopService.getShopByFreelancerId(freelancerId));
    }

    // FREELANCER only (own shop)
    @PutMapping("/{id}")
    public ResponseEntity<Shop> updateShop(
            @PathVariable Long id,
            @RequestBody Shop shop,
            @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7);
        Long userId = jwtUtil.extractUserId(token);
        return ResponseEntity.ok(shopService.updateShop(id, shop, userId));
    }

    // FREELANCER only (own shop)
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