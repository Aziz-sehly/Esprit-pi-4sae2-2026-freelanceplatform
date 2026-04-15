package com.payment.payment.service;

import com.payment.payment.dto.UserSummary;
import com.payment.payment.model.Payment;
import com.payment.payment.model.PaymentMethod;
import com.payment.payment.model.PaymentStatus;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Properties;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class PaymentEmailServiceTest {

    private JavaMailSender mailSender;
    private PaymentEmailService paymentEmailService;

    @BeforeEach
    void setUp() {
        mailSender = mock(JavaMailSender.class);
        paymentEmailService = new PaymentEmailService(mailSender);
        ReflectionTestUtils.setField(paymentEmailService, "fromEmail", "midimidimidi98@gmail.com");
    }

    @Test
    void sendFundedEmail_sendsMessageToVerifiedFreelancer() throws Exception {
        MimeMessage mimeMessage = new MimeMessage(Session.getInstance(new Properties()));
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        paymentEmailService.sendFundedEmail(sampleFreelancer(), samplePayment(PaymentStatus.FUNDED));

        verify(mailSender).send(any(MimeMessage.class));
        assertThat(mimeMessage.getAllRecipients()).hasSize(1);
        assertThat(mimeMessage.getAllRecipients()[0].toString()).isEqualTo("freelancer@test.com");
        assertThat(mimeMessage.getSubject()).isEqualTo("Your milestone payment has been secured");
        assertThat(mimeMessage.getContent().toString()).contains("Payment secured for contract #9");
        assertThat(mimeMessage.getContent().toString()).contains("Freelancer receives");
    }

    @Test
    void sendReleasedEmail_sendsMessageToVerifiedFreelancer() throws Exception {
        MimeMessage mimeMessage = new MimeMessage(Session.getInstance(new Properties()));
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        paymentEmailService.sendReleasedEmail(sampleFreelancer(), samplePayment(PaymentStatus.RELEASED));

        verify(mailSender).send(any(MimeMessage.class));
        assertThat(mimeMessage.getSubject()).isEqualTo("Your milestone payment has been released");
        assertThat(mimeMessage.getContent().toString()).contains("Payment released for contract #9");
        assertThat(mimeMessage.getContent().toString()).contains("Paid out amount");
    }

    @Test
    void sendFundedEmail_skipsUnverifiedFreelancer() {
        UserSummary freelancer = new UserSummary(6L, "freelancer@test.com", "Free", "Lancer", false, true);

        paymentEmailService.sendFundedEmail(freelancer, samplePayment(PaymentStatus.FUNDED));

        verify(mailSender, never()).createMimeMessage();
        verify(mailSender, never()).send(any(MimeMessage.class));
    }

    private UserSummary sampleFreelancer() {
        return new UserSummary(6L, "freelancer@test.com", "Free", "Lancer", true, true);
    }

    private Payment samplePayment(PaymentStatus status) {
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
                .status(status)
                .provider("STRIPE")
                .currency("usd")
                .createdAt(LocalDateTime.now())
                .build();
    }
}
