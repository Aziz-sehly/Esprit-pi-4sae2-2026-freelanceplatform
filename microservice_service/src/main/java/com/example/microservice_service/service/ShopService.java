package com.example.microservice_service.service;

import com.example.microservice_service.entity.Shop;
import com.example.microservice_service.repository.ShopRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ShopService {

    private final ShopRepository shopRepository;

    public Shop createShop(Shop shop) {
        if (shopRepository.existsByFreelancerId(shop.getFreelancerId())) {
            throw new IllegalStateException("A shop already exists for this freelancer.");
        }
        return shopRepository.save(shop);
    }

    public Shop getShopById(Long id) {
        return shopRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Shop not found with id: " + id));
    }

    public Shop getShopByFreelancerId(Long freelancerId) {
        return shopRepository.findByFreelancerId(freelancerId)
                .orElseThrow(() -> new RuntimeException("Shop not found for freelancer: " + freelancerId));
    }

    public List<Shop> getAllShops() {
        return shopRepository.findAll();
    }

    public Shop updateShop(Long id, Shop updated) {
        Shop existing = getShopById(id);
        existing.setShopName(updated.getShopName());
        existing.setTagline(updated.getTagline());
        existing.setDescription(updated.getDescription());
        existing.setBannerUrl(updated.getBannerUrl());
        existing.setAvatarUrl(updated.getAvatarUrl());
        return shopRepository.save(existing);
    }

    public void deleteShop(Long id) {
        shopRepository.deleteById(id);
    }
}
