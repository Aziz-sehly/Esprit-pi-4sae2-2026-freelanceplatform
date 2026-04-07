package com.example.microservice_service.service;

import com.example.microservice_service.client.UserClient;
import com.example.microservice_service.dto.UserResponse;
import com.example.microservice_service.entity.Shop;
import com.example.microservice_service.repository.ShopRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ShopService {

    private final ShopRepository shopRepository;
    private final UserClient userClient;

    // Only FREELANCER can create a shop
    public Shop createShop(Long freelancerId, Shop shopRequest) {
        UserResponse user = userClient.getUserById(freelancerId);

        if (!user.getRole().equals("FREELANCER")) {
            throw new IllegalStateException("Only freelancers can create a shop.");
        }
        if (!user.isVerified()) {
            throw new IllegalStateException("User must be verified to create a shop.");
        }
        if (shopRepository.existsByFreelancerId(freelancerId)) {
            throw new IllegalStateException("A shop already exists for this freelancer.");
        }

        Shop shop = new Shop();
        shop.setFreelancerId(freelancerId);
        shop.setShopName(shopRequest.getShopName());
        shop.setTagline(shopRequest.getTagline());
        shop.setDescription(shopRequest.getDescription());
        shop.setBannerUrl(shopRequest.getBannerUrl());
        shop.setAvatarUrl(shopRequest.getAvatarUrl());
        return shopRepository.save(shop);
    }

    // Anyone can view shops
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

    // Only the shop owner can update
    public Shop updateShop(Long id, Shop updated, Long requesterId) {
        Shop existing = getShopById(id);
        if (!existing.getFreelancerId().equals(requesterId)) {
            throw new IllegalStateException("You can only update your own shop.");
        }
        existing.setShopName(updated.getShopName());
        existing.setTagline(updated.getTagline());
        existing.setDescription(updated.getDescription());
        existing.setBannerUrl(updated.getBannerUrl());
        existing.setAvatarUrl(updated.getAvatarUrl());
        return shopRepository.save(existing);
    }

    // Only the shop owner can delete
    public void deleteShop(Long id, Long requesterId) {
        Shop existing = getShopById(id);
        if (!existing.getFreelancerId().equals(requesterId)) {
            throw new IllegalStateException("You can only delete your own shop.");
        }
        shopRepository.deleteById(id);
    }
}