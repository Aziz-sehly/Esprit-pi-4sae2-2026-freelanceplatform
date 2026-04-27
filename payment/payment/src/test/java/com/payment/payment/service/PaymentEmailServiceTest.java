package com.payment.payment.service;

import com.payment.payment.dto.UserSummary;
import com.payment.payment.model.Payment;
import com.payment.payment.model.PaymentMethod;
import com.payment.payment.model.PaymentStatus;
import jakarta.mail.BodyPart;
import jakarta.mail.Multipart;
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
        String htmlBody = extractBody(mimeMessage);
        assertThat(htmlBody).isNotBlank();
        assertThat(htmlBody).contains("contract #9");
    }

    @Test
    void sendReleasedEmail_sendsMessageToVerifiedFreelancer() throws Exception {
        MimeMessage mimeMessage = new MimeMessage(Session.getInstance(new Properties()));
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        paymentEmailService.sendReleasedEmail(sampleFreelancer(), samplePayment(PaymentStatus.RELEASED));

        verify(mailSender).send(any(MimeMessage.class));
        assertThat(mimeMessage.getSubject()).isEqualTo("Your milestone payment has been released");
        String htmlBody = extractBody(mimeMessage);
        assertThat(htmlBody).isNotBlank();
        assertThat(htmlBody).contains("contract #9");
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

    private String extractBody(MimeMessage mimeMessage) throws Exception {
        return extractBody(mimeMessage.getContent());
    }

    private String extractBody(Object content) throws Exception {
        if (content instanceof String body) {
            return body;
        }
        if (content instanceof Multipart multipart) {
            for (int i = 0; i < multipart.getCount(); i++) {
                BodyPart part = multipart.getBodyPart(i);
                try {
                    return extractBody(part.getContent());
                } catch (AssertionError ignored) {
                    // Keep scanning until a text body part is found.
                }
            }
        }
        throw new AssertionError("Unsupported MimeMessage content type: " + content.getClass().getName());
    }
}
