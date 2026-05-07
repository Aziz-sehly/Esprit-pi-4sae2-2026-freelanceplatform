package com.example.microservice_service.repository;

import com.example.microservice_service.entity.CustomOffer;
import com.example.microservice_service.entity.enums.CustomOfferStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CustomOfferRepository extends JpaRepository<CustomOffer, Long> {
    List<CustomOffer> findBySenderId(Long senderId);
    List<CustomOffer> findByReceiverId(Long receiverId);
    List<CustomOffer> findByReceiverIdAndStatus(Long receiverId, CustomOfferStatus status);
    List<CustomOffer> findBySenderIdAndStatus(Long senderId, CustomOfferStatus status);
}
