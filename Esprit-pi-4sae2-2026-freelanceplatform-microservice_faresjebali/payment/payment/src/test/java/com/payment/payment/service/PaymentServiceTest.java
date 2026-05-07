package com.payment.payment.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.payment.payment.client.MilestoneClient;
import com.payment.payment.client.UserClient;
import com.payment.payment.dto.ContractSummary;
import com.payment.payment.dto.PaymentResponse;
import com.payment.payment.dto.UserSummary;
import com.payment.payment.model.Payment;
import com.payment.payment.model.PaymentMethod;
import com.payment.payment.model.PaymentStatus;
import com.payment.payment.repository.PaymentRepository;
import com.payment.payment.security.CurrentUser;
import com.payment.payment.security.JwtIdentityService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock
    private PaymentRepository repo;
    @Mock
    private MilestoneClient milestoneClient;
    @Mock
    private UserClient userClient;
    @Mock
    private org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;
    @Mock
    private ObjectMapper objectMapper;
    @Mock
    private JwtIdentityService jwtIdentityService;
    @Mock
    private PaymentEmailService paymentEmailService;

    @InjectMocks
    private PaymentService paymentService;

    @Test
    void release_marksPaymentReleased_andSendsFreelancerEmail() {
        Payment payment = samplePayment();
        payment.setStatus(PaymentStatus.FUNDED);
        ContractSummary contract = new ContractSummary(
                9L, 2L, 6L, "Website", "Build website", new BigDecimal("300.00"),
                "Client User", "Free Lancer", null, null, null, "ACTIVE", null, null
        );
        CurrentUser actor = new CurrentUser(2L, "client@test.com", "CLIENT");
        UserSummary freelancer = new UserSummary(6L, "freelancer@test.com", "Free", "Lancer", true, true);

        when(repo.findById(12L)).thenReturn(Optional.of(payment));
        when(milestoneClient.getContract(9L, "Bearer token")).thenReturn(contract);
        when(jwtIdentityService.parseRequired("Bearer token")).thenReturn(actor);
        when(repo.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(userClient.getUserById(6L)).thenReturn(freelancer);

        PaymentResponse response = paymentService.release(12L, "Bearer token");

        assertThat(response.status()).isEqualTo(PaymentStatus.RELEASED);
        ArgumentCaptor<Payment> savedPayment = ArgumentCaptor.forClass(Payment.class);
        verify(repo).save(savedPayment.capture());
        assertThat(savedPayment.getValue().getStatus()).isEqualTo(PaymentStatus.RELEASED);
        assertThat(savedPayment.getValue().getReleasedAt()).isNotNull();
        verify(milestoneClient).markPaid(4L);
        verify(paymentEmailService).sendReleasedEmail(freelancer, savedPayment.getValue());
    }

    private Payment samplePayment() {
        return Payment.builder()
                .id(12L)
                .contractId(9L)
                .milestoneId(4L)
                .payerId(2L)
                .payeeId(6L)
                .amount(new BigDecimal("120.00"))
                .platformFee(new BigDecimal("6.00"))
                .netAmount(new BigDecimal("114.00"))
                .method(PaymentMethod.CARD)
                .status(PaymentStatus.FUNDED)
                .provider("STRIPE")
                .currency("usd")
                .createdAt(LocalDateTime.now())
                .build();
    }

}
