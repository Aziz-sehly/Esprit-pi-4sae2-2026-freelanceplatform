package com.example.microservice_service.service;

import com.example.microservice_service.entity.FreelancerService;
import com.example.microservice_service.entity.Shop;
import com.example.microservice_service.entity.enums.ServiceStatus;
import com.example.microservice_service.repository.FreelancerServiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FreelancerServiceService {

    private final FreelancerServiceRepository serviceRepository;
    private final ShopService shopService;

    public FreelancerService createService(Long shopId, FreelancerService service) {
        Shop shop = shopService.getShopById(shopId);
        service.setShop(shop);
        service.setStatus(ServiceStatus.DRAFT);
        return serviceRepository.save(service);
    }

    public FreelancerService getServiceById(Long id) {
        return serviceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service not found with id: " + id));
    }

    public FreelancerService getServiceBySlug(String slug) {
        return serviceRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("Service not found with slug: " + slug));
    }

    public List<FreelancerService> getServicesByShop(Long shopId) {
        return serviceRepository.findByShopId(shopId);
    }

    public List<FreelancerService> getActiveServices() {
        return serviceRepository.findByStatus(ServiceStatus.ACTIVE);
    }

    public List<FreelancerService> getActiveServicesByCategory(String category) {
        return serviceRepository.findByCategoryAndStatus(category, ServiceStatus.ACTIVE);
    }

    public List<FreelancerService> getPendingServices() {
        return serviceRepository.findByStatus(ServiceStatus.SUBMITTED);
    }

    public FreelancerService updateService(Long id, FreelancerService updated) {
        FreelancerService existing = getServiceById(id);
        existing.setTitle(updated.getTitle());
        existing.setDescription(updated.getDescription());
        existing.setCategory(updated.getCategory());
        existing.setTags(updated.getTags());
        existing.setPrice(updated.getPrice());
        existing.setDeliveryDays(updated.getDeliveryDays());
        existing.setRevisionCount(updated.getRevisionCount());
        existing.setRequirementsDescription(updated.getRequirementsDescription());
        existing.setMediaUrls(updated.getMediaUrls());
        return serviceRepository.save(existing);
    }

    // Freelancer submits service for moderation
    public FreelancerService submitForReview(Long id) {
        FreelancerService service = getServiceById(id);
        if (service.getStatus() != ServiceStatus.DRAFT && service.getStatus() != ServiceStatus.REJECTED) {
            throw new IllegalStateException("Only DRAFT or REJECTED services can be submitted for review.");
        }
        service.setStatus(ServiceStatus.SUBMITTED);
        return serviceRepository.save(service);
    }

    // Admin approves service
    public FreelancerService approveService(Long id) {
        FreelancerService service = getServiceById(id);
        service.setStatus(ServiceStatus.ACTIVE);
        service.setRejectionReason(null);
        return serviceRepository.save(service);
    }

    // Admin rejects service
    public FreelancerService rejectService(Long id, String reason) {
        FreelancerService service = getServiceById(id);
        service.setStatus(ServiceStatus.REJECTED);
        service.setRejectionReason(reason);
        return serviceRepository.save(service);
    }

    // Freelancer pauses/unpauses their service
    public FreelancerService togglePause(Long id) {
        FreelancerService service = getServiceById(id);
        if (service.getStatus() == ServiceStatus.ACTIVE) {
            service.setStatus(ServiceStatus.PAUSED);
        } else if (service.getStatus() == ServiceStatus.PAUSED) {
            service.setStatus(ServiceStatus.ACTIVE);
        } else {
            throw new IllegalStateException("Only ACTIVE or PAUSED services can be toggled.");
        }
        return serviceRepository.save(service);
    }

    public FreelancerService archiveService(Long id) {
        FreelancerService service = getServiceById(id);
        service.setStatus(ServiceStatus.ARCHIVED);
        return serviceRepository.save(service);
    }

    public void deleteService(Long id) {
        serviceRepository.deleteById(id);
    }
}
