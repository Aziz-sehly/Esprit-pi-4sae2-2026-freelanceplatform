package com.example.microservice_service.controller;

import com.example.microservice_service.entity.Shop;
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

    @PostMapping
    public ResponseEntity<Shop> createShop(@RequestBody Shop shop) {
        return ResponseEntity.status(HttpStatus.CREATED).body(shopService.createShop(shop));
    }

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

    @PutMapping("/{id}")
    public ResponseEntity<Shop> updateShop(@PathVariable Long id, @RequestBody Shop shop) {
        return ResponseEntity.ok(shopService.updateShop(id, shop));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteShop(@PathVariable Long id) {
        shopService.deleteShop(id);
        return ResponseEntity.noContent().build();
    }
}
