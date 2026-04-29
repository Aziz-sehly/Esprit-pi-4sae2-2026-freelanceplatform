package com.payment.payment.service;

import com.payment.payment.dto.UserSummary;
import com.payment.payment.model.Payment;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor
public class PaymentEmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from:}")
    private String fromEmail;

    public void sendFundedEmail(UserSummary freelancer, Payment payment) {
        if (!canSendTo(freelancer)) {
            return;
        }

        String fullName = fullName(freelancer);
        String subject = "Your milestone payment has been secured";
        String html = """
                <div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;padding:24px;color:#0f172a">
                    <h2 style="margin-bottom:12px;color:#17317e">Payment secured for contract #%d</h2>
                    <p>Hello %s,</p>
                    <p>Your client has funded a milestone payment.</p>
                    <div style="margin:18px 0;padding:16px;border-radius:14px;background:#f5f8ff;border:1px solid #dbe5ff">
                        <p style="margin:0 0 8px"><strong>Milestone:</strong> %s</p>
                        <p style="margin:0 0 8px"><strong>Gross amount:</strong> %s %s</p>
                        <p style="margin:0"><strong>Freelancer receives:</strong> %s %s</p>
                    </div>
                    <p>The payment is now secured in the platform flow. It will be paid out once the client releases it.</p>
                    <p style="margin-top:24px;color:#64748b;font-size:13px">This is an automated payment status update from Talently Flow.</p>
                </div>
                """.formatted(
                payment.getContractId(),
                fullName,
                payment.getMilestoneId() == null ? "Not linked" : "#" + payment.getMilestoneId(),
                payment.getAmount(),
                payment.getCurrency().toUpperCase(),
                payment.getNetAmount(),
                payment.getCurrency().toUpperCase()
        );

        send(freelancer.email(), subject, html);
    }

    public void sendReleasedEmail(UserSummary freelancer, Payment payment) {
        if (!canSendTo(freelancer)) {
            return;
        }

        String fullName = fullName(freelancer);
        String subject = "Your milestone payment has been released";
        String html = """
                <div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;padding:24px;color:#0f172a">
                    <h2 style="margin-bottom:12px;color:#0f9d6c">Payment released for contract #%d</h2>
                    <p>Hello %s,</p>
                    <p>Your client has released the funded milestone payment.</p>
                    <div style="margin:18px 0;padding:16px;border-radius:14px;background:#f2fcf8;border:1px solid #c9f1df">
                        <p style="margin:0 0 8px"><strong>Milestone:</strong> %s</p>
                        <p style="margin:0 0 8px"><strong>Gross amount:</strong> %s %s</p>
                        <p style="margin:0"><strong>Paid out amount:</strong> %s %s</p>
                    </div>
                    <p>The milestone is now financially completed in the platform workflow.</p>
                    <p style="margin-top:24px;color:#64748b;font-size:13px">This is an automated payment status update from Talently Flow.</p>
                </div>
                """.formatted(
                payment.getContractId(),
                fullName,
                payment.getMilestoneId() == null ? "Not linked" : "#" + payment.getMilestoneId(),
                payment.getAmount(),
                payment.getCurrency().toUpperCase(),
                payment.getNetAmount(),
                payment.getCurrency().toUpperCase()
        );

        send(freelancer.email(), subject, html);
    }

    private boolean canSendTo(UserSummary freelancer) {
        return freelancer != null
                && Boolean.TRUE.equals(freelancer.isActive())
                && Boolean.TRUE.equals(freelancer.isVerified())
                && freelancer.email() != null
                && !freelancer.email().isBlank();
    }

    private String fullName(UserSummary freelancer) {
        return (freelancer.firstName() + " " + freelancer.lastName()).trim();
    }

    private void send(String toEmail, String subject, String html) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            if (fromEmail != null && !fromEmail.isBlank()) {
                helper.setFrom(fromEmail);
            }
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(html, true);
            mailSender.send(message);
            log.info("Payment email sent to {} with subject {}", toEmail, subject);
        } catch (MessagingException | RuntimeException ex) {
            log.warn("Payment email could not be sent to {}: {}", toEmail, ex.getMessage());
        }
    }
}
