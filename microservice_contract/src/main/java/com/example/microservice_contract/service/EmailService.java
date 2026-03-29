package com.example.microservice_contract.service;

import com.resend.core.exception.ResendException;
import com.resend.core.provider.impl.AuthenticationProviderStandard;
import com.resend.services.emails.ResendEmails;
import com.resend.services.emails.model.SendEmailRequest;
import com.resend.services.emails.model.SendEmailResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class EmailService {

    private final ResendEmails resendEmails;

    @Value("${app.base-url:http://localhost:8083}")
    private String baseUrl;

    @Value("${resend.from-email:ProLance <onboarding@resend.dev>}")
    private String fromEmail;

    public EmailService(@Value("${resend.api-key}") String apiKey) {
        AuthenticationProviderStandard authProvider = new AuthenticationProviderStandard(apiKey);
        this.resendEmails = new ResendEmails(authProvider);
    }

    public void sendSigningInvitation(String toEmail,
                                      String recipientName,
                                      Long contractId,
                                      String signerRole,
                                      String token) {

        String signingLink = String.format(
                "%s/signing-page.html?contractId=%d&token=%s&role=%s",
                baseUrl, contractId, token, signerRole
        );

        send(toEmail,
                "ProLance — Contract #" + contractId + " awaits your signature",
                "<h2>Hello " + recipientName + "</h2>" +
                        "<p>Click below to sign:</p>" +
                        "<a href='" + signingLink + "'>Sign Contract</a>");
    }

    public void sendContractActivatedEmail(String toEmail,
                                           String recipientName,
                                           Long contractId) {

        send(toEmail,
                "Contract #" + contractId + " ACTIVE",
                "<h2>Hello " + recipientName + "</h2>" +
                        "<p>Your contract is now ACTIVE.</p>");
    }

    private void send(String toEmail, String subject, String html) {
        try {
            SendEmailRequest request = SendEmailRequest.builder()
                    .from(fromEmail)
                    .to(toEmail)
                    .subject(subject)
                    .html(html)
                    .build();

            SendEmailResponse response = resendEmails.sendEmail(request);
            log.info("Email sent: {}", response.getId());

        } catch (ResendException e) {
            log.error("Email error: {}", e.getMessage());
        }
    }
}
