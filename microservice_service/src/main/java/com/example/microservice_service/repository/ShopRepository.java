package com.example.microservice_service.repository;

import com.example.microservice_service.entity.Shop;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface ShopRepository extends JpaRepository<Shop, Long> {
    Optional<Shop> findByFreelancerId(Long freelancerId);
    boolean existsByFreelancerId(Long freelancerId);
}
