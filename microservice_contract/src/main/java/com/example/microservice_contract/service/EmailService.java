package com.example.microservice_contract.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.io.UnsupportedEncodingException;

@Service
@Slf4j
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.frontend-url:http://localhost:4200}")
    private String frontendUrl;

    @Value("${app.mail.from:ProLance <ffaresjebali@gmail.com>}")
    private String fromEmail;

    public void sendSigningInvitation(String toEmail, String recipientName,
                                      Long contractId, String signerRole, String token) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            // Extract email address from the "Name <email>" format
            String senderEmail = extractEmailAddress(fromEmail);
            String senderName = extractSenderName(fromEmail);

            // Handle potential UnsupportedEncodingException
            try {
                helper.setFrom(senderEmail, senderName);
            } catch (UnsupportedEncodingException e) {
                // Fallback to just email without display name
                log.warn("Unsupported encoding for sender name, using email only: {}", e.getMessage());
                helper.setFrom(senderEmail);
            }

            helper.setTo(toEmail);
            helper.setSubject("ProLance - Contract #" + contractId + " Awaits Your Signature");

            String signingLink = frontendUrl + "/front/sign-contract/" + contractId
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
            """.formatted(recipientName != null ? recipientName : "User",
                    contractId, signerRole, signingLink);

            helper.setText(html, true);
            mailSender.send(message);

            log.info("✅ Signing invitation sent to {} for contract {} using Brevo SMTP",
                    toEmail, contractId);

        } catch (MessagingException e) {
            log.error("❌ Failed to send email to {}: {}", toEmail, e.getMessage(), e);
            throw new RuntimeException("Failed to send signing invitation email", e);
        }
    }

    public void sendContractActivatedEmail(String toEmail,
                                           String recipientName,
                                           Long contractId) {
        try {
            String contractLink = frontendUrl + "/contracts/" + contractId;
            String subject = "ProLance - Contract #" + contractId + " is Now Active";

            String htmlBody = """
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 30px; border-radius: 12px 12px 0 0;">
                <h1 style="color: white; margin: 0;">✅ Contract Activated</h1>
              </div>
              <div style="padding: 30px; background: #f8fafc; border: 1px solid #e2e8f0;">
                <h2 style="color: #1e293b;">Hello %s,</h2>
                <p style="color: #475569;">Great news! Contract #%d is now ACTIVE.</p>
                <p style="color: #475569;">Both parties have signed the contract. You can view it here:</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="%s" style="background: linear-gradient(135deg, #10b981, #059669);
                     color: white; padding: 16px 40px; border-radius: 8px;
                     text-decoration: none; font-weight: bold; font-size: 16px;">
                    📄 View Contract
                  </a>
                </div>
                <p style="color: #64748b;">Best regards,<br>The ProLance Team</p>
              </div>
            </div>
            """.formatted(recipientName != null ? recipientName : "User",
                    contractId, contractLink);

            sendHtmlEmail(toEmail, subject, htmlBody);
            log.info("✅ Activation email sent to {} for contract {} using Brevo SMTP",
                    toEmail, contractId);

        } catch (Exception e) {
            log.error("❌ Failed to send activation email to {}: {}", toEmail, e.getMessage(), e);
            // Don't throw - activation email is non-critical
        }
    }

    private void sendHtmlEmail(String toEmail, String subject, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            String senderEmail = extractEmailAddress(fromEmail);
            String senderName = extractSenderName(fromEmail);

            // Handle potential UnsupportedEncodingException
            try {
                helper.setFrom(senderEmail, senderName);
            } catch (UnsupportedEncodingException e) {
                // Fallback to just email without display name
                log.warn("Unsupported encoding for sender name, using email only: {}", e.getMessage());
                helper.setFrom(senderEmail);
            }

            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);

            mailSender.send(message);
            log.info("✅ HTML Email sent to {} | subject: {}", toEmail, subject);

        } catch (MessagingException e) {
            log.error("❌ Failed to send HTML email to {}: {}", toEmail, e.getMessage(), e);
        }
    }

    private void sendTextEmail(String toEmail, String subject, String body) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");

            String senderEmail = extractEmailAddress(fromEmail);
            String senderName = extractSenderName(fromEmail);

            // Handle potential UnsupportedEncodingException
            try {
                helper.setFrom(senderEmail, senderName);
            } catch (UnsupportedEncodingException e) {
                // Fallback to just email without display name
                log.warn("Unsupported encoding for sender name, using email only: {}", e.getMessage());
                helper.setFrom(senderEmail);
            }

            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(body, false);

            mailSender.send(message);
            log.info("✅ Text Email sent to {} | subject: {}", toEmail, subject);

        } catch (MessagingException e) {
            log.error("❌ Failed to send text email to {}: {}", toEmail, e.getMessage(), e);
        }
    }

    /**
     * Extracts email address from format "Name <email@domain.com>"
     */
    private String extractEmailAddress(String fromAddress) {
        if (fromAddress == null) return "noreply@prolance.com";

        int start = fromAddress.indexOf('<');
        int end = fromAddress.indexOf('>');

        if (start >= 0 && end > start) {
            return fromAddress.substring(start + 1, end).trim();
        }

        return fromAddress.trim();
    }

    /**
     * Extracts sender name from format "Name <email@domain.com>"
     */
    private String extractSenderName(String fromAddress) {
        if (fromAddress == null) return "ProLance";

        int start = fromAddress.indexOf('<');

        if (start > 0) {
            return fromAddress.substring(0, start).trim();
        }

        return "ProLance";
    }
}