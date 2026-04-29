package com.example.microservice_service.service;

import com.example.microservice_service.entity.CustomOffer;
import com.example.microservice_service.entity.enums.CustomOfferStatus;
import com.example.microservice_service.repository.CustomOfferRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomOfferService {

    private final CustomOfferRepository customOfferRepository;
    private final FreelancerServiceService freelancerServiceService;

    public CustomOffer createOffer(CustomOffer offer) {
        // Optionally link to a service
        if (offer.getService() != null && offer.getService().getId() != null) {
            offer.setService(freelancerServiceService.getServiceById(offer.getService().getId()));
        }
        offer.setStatus(CustomOfferStatus.PENDING);
        return customOfferRepository.save(offer);
    }

    public CustomOffer getOfferById(Long id) {
        return customOfferRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Custom offer not found with id: " + id));
    }

    public List<CustomOffer> getOffersBySender(Long senderId) {
        return customOfferRepository.findBySenderId(senderId);
    }

    public List<CustomOffer> getOffersByReceiver(Long receiverId) {
        return customOfferRepository.findByReceiverId(receiverId);
    }

    public List<CustomOffer> getPendingOffersForReceiver(Long receiverId) {
        return customOfferRepository.findByReceiverIdAndStatus(receiverId, CustomOfferStatus.PENDING);
    }

    // Buyer accepts the offer — creates an order from it
    public CustomOffer acceptOffer(Long offerId) {
        CustomOffer offer = getOfferById(offerId);
        if (offer.getStatus() != CustomOfferStatus.PENDING) {
            throw new IllegalStateException("Only PENDING offers can be accepted.");
        }
        offer.setStatus(CustomOfferStatus.ACCEPTED);
        return customOfferRepository.save(offer);
    }

    public CustomOffer declineOffer(Long offerId) {
        CustomOffer offer = getOfferById(offerId);
        if (offer.getStatus() != CustomOfferStatus.PENDING) {
            throw new IllegalStateException("Only PENDING offers can be declined.");
        }
        offer.setStatus(CustomOfferStatus.DECLINED);
        return customOfferRepository.save(offer);
    }

    public CustomOffer expireOffer(Long offerId) {
        CustomOffer offer = getOfferById(offerId);
        offer.setStatus(CustomOfferStatus.EXPIRED);
        return customOfferRepository.save(offer);
    }

    public void deleteOffer(Long id) {
        customOfferRepository.deleteById(id);
    }
}
