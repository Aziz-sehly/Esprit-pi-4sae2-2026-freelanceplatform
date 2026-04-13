package com.example.microservice_contract.service;

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
public class EmailService {

    private final JavaMailSender mailSender;

    // 🔥 FRONTEND URL (Angular app), not backend/gateway
    @Value("${app.frontend-url:http://localhost:4200}")
    private String frontendUrl;

    @Value("${app.mail.from:ProLance <noreply@prolance.com>}")
    private String fromEmail;

    public void sendSigningInvitation(String toEmail, String recipientName,
                                      Long contractId, String signerRole, String token) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom("noreply@prolance.com", "ProLance");
            helper.setTo(toEmail);
            helper.setSubject("ProLance - Contract #" + contractId + " Awaits Your Signature");

            String signingLink = "http://localhost:4200/front/sign-contract/" + contractId
                    + "?token=" + token + "&role=" + signerRole;

            String html = """
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 30px; border-radius: 12px 12px 0 0;">
                <h1 style="color: white; margin: 0;">ProLance</h1>
              </div>
              <div style="padding: 30px; background: #f8fafc; border: 1px solid #e2e8f0;">
                <h2 style="color: #1e293b;">Hello %s,</h2>
                <p style="color: #475569;">You have a contract waiting for your signature.</p>
                <table style="width: 100%%; background: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
                  <tr><td style="color: #64748b;">Contract ID:</td><td style="font-weight: bold;">#%d</td></tr>
                  <tr><td style="color: #64748b;">Your Role:</td><td style="font-weight: bold;">%s</td></tr>
                </table>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="%s" style="background: linear-gradient(135deg, #4f46e5, #7c3aed);
                     color: white; padding: 16px 40px; border-radius: 8px;
                     text-decoration: none; font-weight: bold; font-size: 16px;">
                    ✍️ Sign Contract
                  </a>
                </div>
                <p style="color: #94a3b8; font-size: 12px; text-align: center;">
                  This link expires in 7 days. If you're not logged in, you'll be redirected to login first.
                </p>
              </div>
            </div>
            """.formatted(recipientName, contractId, signerRole, signingLink);

            helper.setText(html, true); // true = isHtml
            mailSender.send(message);

            log.info("✅ Signing invitation sent to {} for contract {}", toEmail, contractId);
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", toEmail, e.getMessage());
            throw new RuntimeException(e);
        }
    }

    public void sendContractActivatedEmail(String toEmail,
                                           String recipientName,
                                           Long contractId) {

        String contractLink = String.format(
                "%s/contracts/%d",
                frontendUrl, contractId
        );

        String subject = "ProLance - Contract #" + contractId + " is Now Active";

        String body = String.format(
                "Hello %s,\n\n" +
                        "Great news! Contract #%d is now ACTIVE.\n\n" +
                        "Both parties have signed the contract. You can view it here:\n%s\n\n" +
                        "Best regards,\n" +
                        "The ProLance Team",
                recipientName, contractId, contractLink
        );

        sendTextEmail(toEmail, subject, body);
        log.info("✅ Activation email sent to {} for contract {}", toEmail, contractId);
    }

    private void sendTextEmail(String toEmail, String subject, String body) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(body, false); // false = plain text, not HTML

            mailSender.send(message);
            log.info("✅ Email sent to {} | subject: {}", toEmail, subject);

        } catch (MessagingException e) {
            log.error("❌ Failed to send email to {}: {}", toEmail, e.getMessage(), e);
        }
    }
}