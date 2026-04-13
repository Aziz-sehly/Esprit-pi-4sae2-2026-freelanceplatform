package com.example.microservice_service.service;

import com.example.microservice_service.client.UserClient;
import com.example.microservice_service.dto.ShopRequest;
import com.example.microservice_service.dto.UserResponse;
import com.example.microservice_service.entity.Shop;
import com.example.microservice_service.repository.ShopRepository;
import feign.FeignException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ShopService {

    private final ShopRepository shopRepository;
    private final UserClient userClient;

    public Shop createShop(Long freelancerId, ShopRequest req) {
        UserResponse user;
        try {
            user = userClient.getUserById(freelancerId);
        } catch (FeignException.NotFound e) {
            throw new IllegalArgumentException("User not found with id: " + freelancerId);
        } catch (RuntimeException e) {
            throw new IllegalStateException("Could not verify user: " + e.getMessage(), e);
        }

        if (!user.getRole().equals("FREELANCER")) {
            throw new IllegalStateException("Only freelancers can create a shop.");
        }
        if (!user.isVerified()) {
            throw new IllegalStateException("User must be verified to create a shop.");
        }
        if (shopRepository.existsByFreelancerId(freelancerId)) {
            throw new IllegalStateException("A shop already exists for this freelancer.");
        }

        // ✅ shopName and avatarUrl come cleanly from the DTO
        Shop shop = new Shop();
        shop.setFreelancerId(freelancerId);
        shop.setShopName(req.getShopName());
        shop.setTagline(req.getTagline());
        shop.setDescription(req.getDescription());
        shop.setAvatarUrl(req.getAvatarUrl());
        shop.setBannerUrl(req.getBannerUrl());
        return shopRepository.save(shop);
    }

    public Shop getShopById(Long id) {
        return shopRepository.findById(id).orElse(null);
    }

    public Shop getShopByFreelancerId(Long freelancerId) {
        return shopRepository.findByFreelancerId(freelancerId).orElse(null);
    }

    public List<Shop> getAllShops() {
        return shopRepository.findAll();
    }

    public Shop updateShop(Long id, ShopRequest req, Long requesterId) {
        Shop existing = getShopById(id);
        if (existing == null) {
            throw new RuntimeException("Shop not found with id: " + id);
        }
        if (!existing.getFreelancerId().equals(requesterId)) {
            throw new IllegalStateException("You can only update your own shop.");
        }
        existing.setShopName(req.getShopName());
        existing.setTagline(req.getTagline());
        existing.setDescription(req.getDescription());
        existing.setAvatarUrl(req.getAvatarUrl());
        existing.setBannerUrl(req.getBannerUrl());
        return shopRepository.save(existing);
    }

    public void deleteShop(Long id, Long requesterId) {
        Shop existing = getShopById(id);
        if (existing == null) {
            throw new RuntimeException("Shop not found with id: " + id);
        }
        if (!existing.getFreelancerId().equals(requesterId)) {
            throw new IllegalStateException("You can only delete your own shop.");
        }
        shopRepository.deleteById(id);
    }
}