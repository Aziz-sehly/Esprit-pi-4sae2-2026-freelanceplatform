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

    @Value("${app.base-url:http://localhost:8083}")
    private String baseUrl;

    @Value("${app.mail.from:ProLance <noreply@prolance.com>}")
    private String fromEmail;

    public void sendSigningInvitation(String toEmail,
                                      String recipientName,
                                      Long contractId,
                                      String signerRole,
                                      String token) {

        String signingLink = String.format(
                "%s/signing-page.html?contractId=%d&token=%s&role=%s",
                baseUrl, contractId, token, signerRole
        );

        String html = "<div style='font-family:Arial,sans-serif;max-width:600px;margin:auto'>"
                + "<h2 style='color:#4f46e5'>Hello " + recipientName + " 👋</h2>"
                + "<p>A contract is awaiting your signature.</p>"
                + "<p>"
                + "<a href='" + signingLink + "' "
                + "style='display:inline-block;padding:12px 24px;"
                + "background:#4f46e5;color:white;border-radius:6px;"
                + "text-decoration:none;font-weight:bold'>"
                + "✍️ Sign Contract #" + contractId
                + "</a>"
                + "</p>"
                + "<p style='color:#888;font-size:12px'>This link expires in 7 days.</p>"
                + "</div>";

        send(toEmail,
                "ProLance — Contract #" + contractId + " awaits your signature",
                html);
    }

    public void sendContractActivatedEmail(String toEmail,
                                           String recipientName,
                                           Long contractId) {

        String html = "<div style='font-family:Arial,sans-serif;max-width:600px;margin:auto'>"
                + "<h2 style='color:#16a34a'>Hello " + recipientName + " 🎉</h2>"
                + "<p>Great news! Contract <strong>#" + contractId + "</strong> "
                + "is now <span style='color:#16a34a;font-weight:bold'>ACTIVE</span>.</p>"
                + "<p>Both parties have signed. You're good to go!</p>"
                + "</div>";

        send(toEmail,
                "✅ Contract #" + contractId + " is now ACTIVE",
                html);
    }

    private void send(String toEmail, String subject, String html) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(html, true);

            mailSender.send(message);
            log.info("✅ Email sent to {} | subject: {}", toEmail, subject);

        } catch (MessagingException e) {
            log.error("❌ Failed to send email to {}: {}", toEmail, e.getMessage(), e);
        }
    }
}