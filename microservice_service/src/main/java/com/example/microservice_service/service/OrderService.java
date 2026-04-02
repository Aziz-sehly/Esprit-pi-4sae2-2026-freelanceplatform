package com.example.microservice_service.service;

import com.example.microservice_service.entity.FreelancerService;
import com.example.microservice_service.entity.Order;
import com.example.microservice_service.entity.enums.OrderStatus;
import com.example.microservice_service.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final FreelancerServiceService freelancerServiceService;

    public Order createOrder(Order order) {
        FreelancerService service = freelancerServiceService.getServiceById(order.getService().getId());
        order.setService(service);
        order.setSellerId(service.getShop().getFreelancerId());
        order.setStatus(OrderStatus.PENDING_REQUIREMENTS);
        return orderRepository.save(order);
    }

    public Order getOrderById(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + id));
    }

    public List<Order> getOrdersByBuyer(Long buyerId) {
        return orderRepository.findByBuyerId(buyerId);
    }

    public List<Order> getOrdersBySeller(Long sellerId) {
        return orderRepository.findBySellerId(sellerId);
    }

    public List<Order> getOrdersByService(Long serviceId) {
        return orderRepository.findByServiceId(serviceId);
    }

    // Buyer submits requirements — order clock starts here
    public Order submitRequirements(Long orderId, String requirementsAnswer) {
        Order order = getOrderById(orderId);
        if (order.getStatus() != OrderStatus.PENDING_REQUIREMENTS) {
            throw new IllegalStateException("Requirements already submitted for this order.");
        }
        order.setBuyerRequirementsAnswer(requirementsAnswer);
        order.setStatus(OrderStatus.IN_PROGRESS);
        // Set deadline from now based on service delivery days
        int deliveryDays = order.getService().getDeliveryDays();
        order.setDeadline(LocalDateTime.now().plusDays(deliveryDays));
        return orderRepository.save(order);
    }

    // Freelancer delivers the order
    public Order deliverOrder(Long orderId, String deliveryMessage, String deliveryFileUrls) {
        Order order = getOrderById(orderId);
        if (order.getStatus() != OrderStatus.IN_PROGRESS && order.getStatus() != OrderStatus.REVISION_REQUESTED) {
            throw new IllegalStateException("Order is not in a deliverable state.");
        }
        order.setDeliveryMessage(deliveryMessage);
        order.setDeliveryFileUrls(deliveryFileUrls);
        order.setStatus(OrderStatus.DELIVERED);
        return orderRepository.save(order);
    }

    // Buyer requests a revision
    public Order requestRevision(Long orderId, String revisionNotes) {
        Order order = getOrderById(orderId);
        if (order.getStatus() != OrderStatus.DELIVERED) {
            throw new IllegalStateException("Can only request revision on a delivered order.");
        }
        int allowedRevisions = order.getService().getRevisionCount();
        if (order.getRevisionsUsed() >= allowedRevisions) {
            throw new IllegalStateException("Maximum revisions reached for this order.");
        }
        order.setRevisionNotes(revisionNotes);
        order.setRevisionsUsed(order.getRevisionsUsed() + 1);
        order.setStatus(OrderStatus.REVISION_REQUESTED);
        return orderRepository.save(order);
    }

    // Buyer accepts the delivery — order completes
    public Order completeOrder(Long orderId) {
        Order order = getOrderById(orderId);
        if (order.getStatus() != OrderStatus.DELIVERED) {
            throw new IllegalStateException("Can only complete a delivered order.");
        }
        order.setStatus(OrderStatus.COMPLETED);
        order.setCompletedAt(LocalDateTime.now());
        return orderRepository.save(order);
    }

    // Cancel order
    public Order cancelOrder(Long orderId) {
        Order order = getOrderById(orderId);
        if (order.getStatus() == OrderStatus.COMPLETED) {
            throw new IllegalStateException("Cannot cancel a completed order.");
        }
        order.setStatus(OrderStatus.CANCELLED);
        return orderRepository.save(order);
    }

    // Raise a dispute
    public Order disputeOrder(Long orderId) {
        Order order = getOrderById(orderId);
        if (order.getStatus() == OrderStatus.COMPLETED || order.getStatus() == OrderStatus.CANCELLED) {
            throw new IllegalStateException("Cannot dispute a completed or cancelled order.");
        }
        order.setStatus(OrderStatus.DISPUTED);
        return orderRepository.save(order);
    }
}
