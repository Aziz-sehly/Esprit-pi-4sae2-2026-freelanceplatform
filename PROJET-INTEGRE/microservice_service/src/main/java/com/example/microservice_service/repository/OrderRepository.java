package com.example.microservice_service.repository;

import com.example.microservice_service.entity.Order;
import com.example.microservice_service.entity.enums.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByBuyerId(Long buyerId);
    List<Order> findBySellerId(Long sellerId);
    List<Order> findByBuyerIdAndStatus(Long buyerId, OrderStatus status);
    List<Order> findBySellerIdAndStatus(Long sellerId, OrderStatus status);
    List<Order> findByServiceId(Long serviceId);
}
