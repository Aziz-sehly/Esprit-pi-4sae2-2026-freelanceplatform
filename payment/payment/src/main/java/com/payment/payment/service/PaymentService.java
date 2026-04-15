package com.payment.payment.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.payment.payment.client.MilestoneClient;
import com.payment.payment.client.UserClient;
import com.payment.payment.dto.CheckoutSessionResponse;
import com.payment.payment.dto.ContractSummary;
import com.payment.payment.dto.NotificationMessage;
import com.payment.payment.dto.PaymentRequest;
import com.payment.payment.dto.PaymentResponse;
import com.payment.payment.dto.RefundRequest;
import com.payment.payment.dto.UserSummary;
import com.payment.payment.exception.NotFoundException;
import com.payment.payment.model.Payment;
import com.payment.payment.model.PaymentStatus;
import com.payment.payment.repository.PaymentRepository;
import com.payment.payment.security.CurrentUser;
import com.payment.payment.security.JwtIdentityService;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import com.stripe.param.checkout.SessionCreateParams;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class PaymentService {

    private final PaymentRepository repo;
    private final MilestoneClient milestoneClient;
    private final UserClient userClient;
    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper;
    private final JwtIdentityService jwtIdentityService;
    private final PaymentEmailService paymentEmailService;

    @Value("${stripe.secret-key:}")
    private String stripeSecretKey;

    @Value("${stripe.webhook-secret:}")
    private String stripeWebhookSecret;

    @Value("${app.payment.success-url:http://localhost:4200/payments/success}")
    private String successUrl;

    @Value("${app.payment.cancel-url:http://localhost:4200/payments/cancel}")
    private String cancelUrl;

    @PostConstruct
    void initStripe() {
        if (!stripeSecretKey.isBlank()) {
            com.stripe.Stripe.apiKey = stripeSecretKey;
        }
    }

    public PaymentResponse create(PaymentRequest req, String authorization) {
        ContractSummary contract = loadContract(req.contractId(), authorization);
        CurrentUser actor = jwtIdentityService.parseRequired(authorization);
        requireClientOwner(contract, actor);
        Payment saved = repo.save(buildPayment(req, contract, PaymentStatus.PENDING));
        return toResponse(saved);
    }

    public CheckoutSessionResponse createCheckoutSession(PaymentRequest req, String authorization) {
        ContractSummary contract = loadContract(req.contractId(), authorization);
        CurrentUser actor = jwtIdentityService.parseRequired(authorization);
        requireClientOwner(contract, actor);
        Payment payment = repo.save(buildPayment(req, contract, PaymentStatus.INITIATED));

        if (stripeSecretKey.isBlank()) {
            payment.setStatus(PaymentStatus.CHECKOUT_CREATED);
            payment.setProvider("STRIPE");
            payment.setStripeCheckoutSessionId("stub-session-" + payment.getId());
            payment.setProviderRef(payment.getStripeCheckoutSessionId());
            Payment saved = repo.save(payment);
            notify(saved, "PAYMENT_CHECKOUT_CREATED", "Stripe checkout session created");
            return new CheckoutSessionResponse(payment.getId(), payment.getStripeCheckoutSessionId(), null);
        }

        try {
            SessionCreateParams params = SessionCreateParams.builder()
                    .setMode(SessionCreateParams.Mode.PAYMENT)
                    .setSuccessUrl(successUrl + "?paymentId=" + payment.getId() + "&session_id={CHECKOUT_SESSION_ID}")
                    .setCancelUrl(cancelUrl + "?paymentId=" + payment.getId())
                    .putMetadata("paymentId", String.valueOf(payment.getId()))
                    .addLineItem(
                            SessionCreateParams.LineItem.builder()
                                    .setQuantity(1L)
                                    .setPriceData(
                                            SessionCreateParams.LineItem.PriceData.builder()
                                                    .setCurrency(payment.getCurrency())
                                                    .setUnitAmount(payment.getAmount().movePointRight(2).longValueExact())
                                                    .setProductData(
                                                            SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                                                    .setName("Milestone payment #" + payment.getMilestoneId())
                                                                    .build()
                                                    )
                                                    .build()
                                    )
                                    .build()
                    )
                    .build();

            Session session = Session.create(params);
            payment.setStatus(PaymentStatus.CHECKOUT_CREATED);
            payment.setProvider("STRIPE");
            payment.setStripeCheckoutSessionId(session.getId());
            payment.setProviderRef(session.getId());
            Payment saved = repo.save(payment);
            notify(saved, "PAYMENT_CHECKOUT_CREATED", "Stripe checkout session created");

            return new CheckoutSessionResponse(payment.getId(), session.getId(), session.getUrl());
        } catch (StripeException ex) {
            payment.setStatus(PaymentStatus.FAILED);
            repo.save(payment);
            throw new IllegalStateException("Failed to create Stripe checkout session");
        }
    }

    @Transactional(readOnly = true)
    public PaymentResponse getById(Long id, String authorization) {
        Payment payment = repo.findById(id)
                .orElseThrow(() -> new NotFoundException("Payment not found: " + id));
        requireParticipant(loadContract(payment.getContractId(), authorization), jwtIdentityService.parseRequired(authorization));
        return toResponse(payment);
    }

    @Transactional(readOnly = true)
    public List<PaymentResponse> list(Long contractId, Long milestoneId, String authorization) {
        CurrentUser actor = jwtIdentityService.parseRequired(authorization);

        if (milestoneId != null) {
            List<Payment> payments = repo.findByMilestoneId(milestoneId);
            if (!payments.isEmpty()) {
                requireParticipant(loadContract(payments.get(0).getContractId(), authorization), actor);
            }
            return payments.stream().map(this::toResponse).toList();
        }

        if (contractId != null) {
            requireParticipant(loadContract(contractId, authorization), actor);
            return repo.findByContractId(contractId).stream().map(this::toResponse).toList();
        }

        if (actor.isClient()) {
            return repo.findAll().stream()
                    .filter(payment -> payment.getPayerId().equals(actor.id()))
                    .map(this::toResponse)
                    .toList();
        }

        return repo.findAll().stream()
                .filter(payment -> payment.getPayeeId().equals(actor.id()))
                .map(this::toResponse)
                .toList();
    }

    public void handleStripeWebhook(String payload, String signature) {
        if (stripeWebhookSecret.isBlank()) {
            return;
        }

        try {
            Event event = Webhook.constructEvent(payload, signature, stripeWebhookSecret);
            if (!"checkout.session.completed".equals(event.getType())) {
                return;
            }
            JsonNode root = objectMapper.readTree(payload);
            JsonNode sessionNode = root.path("data").path("object");
            JsonNode metadataNode = sessionNode.path("metadata");
            JsonNode paymentIdNode = metadataNode.path("paymentId");

            if (paymentIdNode.isMissingNode() || paymentIdNode.asText().isBlank()) {
                throw new IllegalStateException("Stripe webhook payload is missing metadata.paymentId");
            }

            Long paymentId = Long.valueOf(paymentIdNode.asText());
            Payment payment = repo.findById(paymentId)
                    .orElseThrow(() -> new NotFoundException("Payment not found: " + paymentId));

            payment.setStatus(PaymentStatus.FUNDED);
            payment.setProvider("STRIPE");
            payment.setProviderRef(sessionNode.path("id").asText(payment.getProviderRef()));
            payment.setStripeCheckoutSessionId(sessionNode.path("id").asText(payment.getStripeCheckoutSessionId()));
            payment.setStripePaymentIntentId(sessionNode.path("payment_intent").asText(payment.getStripePaymentIntentId()));
            payment.setWebhookEventId(event.getId());
            Payment saved = repo.save(payment);
            notify(saved, "PAYMENT_FUNDED", "Payment funded successfully");
            sendFundingEmail(saved);

            if (saved.getMilestoneId() != null) {
                milestoneClient.markFunded(saved.getMilestoneId());
            }
        } catch (Exception ex) {
            throw new IllegalStateException("Invalid Stripe webhook payload");
        }
    }

    public PaymentResponse release(Long id, String authorization) {
        Payment payment = repo.findById(id)
                .orElseThrow(() -> new NotFoundException("Payment not found: " + id));
        requireClientOwner(loadContract(payment.getContractId(), authorization), jwtIdentityService.parseRequired(authorization));
        if (payment.getStatus() != PaymentStatus.FUNDED && payment.getStatus() != PaymentStatus.RELEASED) {
            throw new IllegalStateException("Only funded payments can be released");
        }

        payment.setStatus(PaymentStatus.RELEASED);
        payment.setReleasedAt(LocalDateTime.now());
        Payment saved = repo.save(payment);
        notify(saved, "PAYMENT_RELEASED", "Payment released to freelancer");
        sendReleasedEmail(saved);

        if (saved.getMilestoneId() != null) {
            milestoneClient.markPaid(saved.getMilestoneId());
        }

        return toResponse(saved);
    }

    public PaymentResponse requestRefund(Long id, RefundRequest req, String authorization) {
        Payment payment = repo.findById(id)
                .orElseThrow(() -> new NotFoundException("Payment not found: " + id));
        requireClientOwner(loadContract(payment.getContractId(), authorization), jwtIdentityService.parseRequired(authorization));
        if (payment.getStatus() != PaymentStatus.FUNDED && payment.getStatus() != PaymentStatus.RELEASED) {
            throw new IllegalStateException("Only funded or released payments can enter refund flow");
        }

        payment.setStatus(PaymentStatus.REFUND_PENDING);
        payment.setRefundReason(req.reason());
        Payment saved = repo.save(payment);
        notify(saved, "PAYMENT_REFUND_PENDING", "Refund requested: " + req.reason());
        return toResponse(saved);
    }

    public void delete(Long id, String authorization) {
        Payment payment = repo.findById(id)
                .orElseThrow(() -> new NotFoundException("Payment not found: " + id));
        requireClientOwner(loadContract(payment.getContractId(), authorization), jwtIdentityService.parseRequired(authorization));
        repo.deleteById(id);
    }

    private Payment buildPayment(PaymentRequest req, ContractSummary contract, PaymentStatus status) {
        BigDecimal fee = req.amount().multiply(new BigDecimal("0.05")).setScale(2, RoundingMode.HALF_UP);
        BigDecimal netAmount = req.amount().subtract(fee).setScale(2, RoundingMode.HALF_UP);

        return Payment.builder()
                .contractId(req.contractId())
                .milestoneId(req.milestoneId())
                .payerId(contract.clientId())
                .payeeId(contract.freelancerId())
                .amount(req.amount())
                .platformFee(fee)
                .netAmount(netAmount)
                .method(req.method())
                .status(status)
                .provider("STRIPE")
                .currency("usd")
                .build();
    }

    private ContractSummary loadContract(Long contractId, String authorization) {
        return milestoneClient.getContract(contractId, authorization);
    }

    private void requireClientOwner(ContractSummary contract, CurrentUser actor) {
        if (!actor.isClient() || !contract.clientId().equals(actor.id())) {
            throw new IllegalStateException("Only the contract client can perform this payment action");
        }
    }

    private void requireParticipant(ContractSummary contract, CurrentUser actor) {
        if (actor.isAdmin()) {
            return;
        }
        if (actor.isClient() && contract.clientId().equals(actor.id())) {
            return;
        }
        if (actor.isFreelancer() && contract.freelancerId().equals(actor.id())) {
            return;
        }
        throw new IllegalStateException("You do not have access to these payments");
    }

    private PaymentResponse toResponse(Payment payment) {
        return new PaymentResponse(
                payment.getId(),
                payment.getContractId(),
                payment.getMilestoneId(),
                payment.getPayerId(),
                payment.getPayeeId(),
                payment.getAmount(),
                payment.getPlatformFee(),
                payment.getNetAmount(),
                payment.getMethod(),
                payment.getStatus(),
                payment.getProvider(),
                payment.getProviderRef(),
                payment.getStripeCheckoutSessionId(),
                payment.getCurrency(),
                payment.getReleasedAt(),
                payment.getRefundedAt(),
                payment.getCreatedAt()
        );
    }

    private void notify(Payment payment, String type, String message) {
        NotificationMessage payload = new NotificationMessage(
                type,
                payment.getContractId(),
                payment.getMilestoneId(),
                payment.getId(),
                message,
                LocalDateTime.now()
        );
        messagingTemplate.convertAndSend("/topic/notifications", payload);
        messagingTemplate.convertAndSend("/topic/contracts/" + payment.getContractId(), payload);
    }

    private void sendFundingEmail(Payment payment) {
        UserSummary freelancer = loadFreelancer(payment.getPayeeId());
        paymentEmailService.sendFundedEmail(freelancer, payment);
    }

    private void sendReleasedEmail(Payment payment) {
        UserSummary freelancer = loadFreelancer(payment.getPayeeId());
        paymentEmailService.sendReleasedEmail(freelancer, payment);
    }

    private UserSummary loadFreelancer(Long freelancerId) {
        try {
            return userClient.getUserById(freelancerId);
        } catch (RuntimeException ex) {
            return null;
        }
    }
}
