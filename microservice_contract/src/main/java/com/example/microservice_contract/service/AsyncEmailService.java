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

        // Delay second email to avoid Mailtrap rate limit (550 Too many emails/sec)
        if ("FREELANCER".equals(signerRole)) {  // ← was 'role', fixed to 'signerRole'
            try {
                Thread.sleep(10000);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }

        log.info("Sending signing invitation to {} [{}]", toEmail, signerRole);
        try {
            emailService.sendSigningInvitation(toEmail, recipientName, contractId, signerRole, token);
            log.info("Signing invitation sent successfully to {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send signing invitation to {}: {}", toEmail, e.getMessage(), e);
            throw new RuntimeException(e);
        }
    }

    @Async("emailTaskExecutor")
    public void sendContractActivated(String toEmail,
                                      String recipientName,
                                      Long contractId) {
        log.info("Sending contract activation email to {}", toEmail);
        try {
            emailService.sendContractActivatedEmail(toEmail, recipientName, contractId);
            log.info("Activation email sent successfully to {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send activation email to {}: {}", toEmail, e.getMessage(), e);
        }
    }
}