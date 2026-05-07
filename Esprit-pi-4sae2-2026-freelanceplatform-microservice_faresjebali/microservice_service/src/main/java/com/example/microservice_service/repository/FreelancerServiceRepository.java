package com.example.microservice_service.repository;

import com.example.microservice_service.entity.FreelancerService;
import com.example.microservice_service.entity.enums.ServiceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface FreelancerServiceRepository extends JpaRepository<FreelancerService, Long> {
    List<FreelancerService> findByShopId(Long shopId);
    List<FreelancerService> findByStatus(ServiceStatus status);
    List<FreelancerService> findByShopIdAndStatus(Long shopId, ServiceStatus status);
    Optional<FreelancerService> findBySlug(String slug);
    List<FreelancerService> findByCategoryAndStatus(String category, ServiceStatus status);
}
