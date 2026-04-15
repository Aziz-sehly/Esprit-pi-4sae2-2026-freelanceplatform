package com.prolance.user.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${app.mail.from:ProLance <noreply@prolance.com>}")
    private String fromEmail;

    @Value("${app.public.verification-base-url:http://localhost:8080}")
    private String verificationBaseUrl;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendVerificationEmail(String toEmail, String firstName, String verificationToken) {
        String verificationLink = verificationBaseUrl.replaceAll("/$", "")
                + "/users/auth/verify-email?token="
                + verificationToken;

        String html = """
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
                    <h2 style="color:#4f46e5">Bienvenue sur ProLance, %s</h2>
                    <p>Merci de votre inscription. Vérifiez votre adresse e-mail pour activer votre compte.</p>
                    <p>
                        <a href="%s"
                           style="display:inline-block;padding:12px 24px;
                                  background:#4f46e5;color:white;
                                  text-decoration:none;border-radius:6px;
                                  font-weight:bold">
                            Vérifier mon e-mail
                        </a>
                    </p>
                    <p style="color:#888;font-size:12px">
                        Ce lien expire sous 24 h.<br>
                        Si vous n'êtes pas à l'origine de cette inscription, ignorez ce message.
                    </p>
                </div>
                """.formatted(firstName, verificationLink);

        send(toEmail, "Vérifiez votre compte ProLance", html);
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
            log.info("E-mail envoyé à {} | {}", toEmail, subject);
        } catch (MessagingException e) {
            log.error("Échec d'envoi d'e-mail à {}: {}", toEmail, e.getMessage());
        }
    }
}
