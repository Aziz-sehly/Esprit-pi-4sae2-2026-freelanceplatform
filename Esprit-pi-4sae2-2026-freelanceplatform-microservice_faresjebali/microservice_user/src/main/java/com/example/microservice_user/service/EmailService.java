package com.example.microservice_user.service;

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

    @Value("${app.mail.from:ProLance <noreply@prolance.com>}")
    private String fromEmail;

    public void sendVerificationEmail(String toEmail,
                                      String firstName,
                                      String verificationToken) {

        String verificationLink = "http://localhost:8084/api/auth/verify-email?token="
                + verificationToken;

        String html = """
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
                    <h2 style="color:#4f46e5">Welcome to ProLance, %s! 👋</h2>
                    <p>Thank you for registering. Please verify your email to activate your account.</p>
                    <p>
                        <a href="%s"
                           style="display:inline-block;padding:12px 24px;
                                  background:#4f46e5;color:white;
                                  text-decoration:none;border-radius:6px;
                                  font-weight:bold">
                            ✅ Verify My Email
                        </a>
                    </p>
                    <p style="color:#888;font-size:12px">
                        This link expires in 24 hours.<br>
                        If you did not create this account, you can safely ignore this email.
                    </p>
                </div>
                """.formatted(firstName, verificationLink);

        send(toEmail, "Verify your ProLance account", html);
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