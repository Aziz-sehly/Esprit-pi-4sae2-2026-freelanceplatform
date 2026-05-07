package com.example.microservice_service.repository;

import com.example.microservice_service.entity.ServiceAddOn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ServiceAddOnRepository extends JpaRepository<ServiceAddOn, Long> {
    List<ServiceAddOn> findByServiceId(Long serviceId);
}
