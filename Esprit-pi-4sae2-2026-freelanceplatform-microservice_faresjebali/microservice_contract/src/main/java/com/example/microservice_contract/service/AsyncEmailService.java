package com.example.microservice_contract.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class AsyncEmailService {

    private final EmailService emailService;

    @Async("emailTaskExecutor")
    public void sendSigningInvitation(String toEmail,
                                      String recipientName,
                                      Long contractId,
                                      String signerRole,
                                      String token) {

        // Brevo has better rate limits than Mailtrap, but we'll keep a small delay for safety
        if ("FREELANCER".equals(signerRole)) {
            try {
                Thread.sleep(2000); // Reduced from 10000ms to 2000ms
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }

        log.info("📧 Sending signing invitation to {} [{}] via Brevo", toEmail, signerRole);
        try {
            emailService.sendSigningInvitation(toEmail, recipientName, contractId, signerRole, token);
            log.info("✅ Signing invitation sent successfully to {}", toEmail);
        } catch (Exception e) {
            log.error("❌ Failed to send signing invitation to {}: {}", toEmail, e.getMessage(), e);
            throw new RuntimeException("Failed to send signing invitation email", e);
        }
    }

    @Async("emailTaskExecutor")
    public void sendContractActivated(String toEmail,
                                      String recipientName,
                                      Long contractId) {
        log.info("📧 Sending contract activation email to {} via Brevo", toEmail);
        try {
            emailService.sendContractActivatedEmail(toEmail, recipientName, contractId);
            log.info("✅ Activation email sent successfully to {}", toEmail);
        } catch (Exception e) {
            log.error("❌ Failed to send activation email to {}: {}", toEmail, e.getMessage(), e);
            // Don't throw - activation email failure shouldn't break contract activation
        }
    }
}