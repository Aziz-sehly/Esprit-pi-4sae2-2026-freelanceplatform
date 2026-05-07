package com.esprit.microservice_project.Services;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Async
    public void sendNewProposalNotification(
            String clientEmail,
            String projectTitle,
            String projectCategory,
            double proposedBudget,
            int deliveryDays,
            String coverLetterPreview
    ) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(clientEmail);
            helper.setSubject("📬 New proposal received — " + projectTitle);
            helper.setText(buildHtml(projectTitle, projectCategory,
                    proposedBudget, deliveryDays, coverLetterPreview), true);

            mailSender.send(message);
            log.info("✅ Email sent to {} for project: {}", clientEmail, projectTitle);

        } catch (MessagingException e) {
            log.error("❌ Email failed: {}", e.getMessage());
        }
    }

    private String buildHtml(String projectTitle, String projectCategory,
                             double proposedBudget, int deliveryDays,
                             String coverLetterPreview) {
        String preview = coverLetterPreview != null && coverLetterPreview.length() > 200
                ? coverLetterPreview.substring(0, 200) + "..." : coverLetterPreview;

        return """
            <!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"/>
              <style>
                body{font-family:Arial,sans-serif;background:#f4f6f9;margin:0;padding:0}
                .container{max-width:600px;margin:40px auto;background:#fff;
                           border-radius:12px;overflow:hidden;
                           box-shadow:0 4px 20px rgba(0,0,0,.08)}
                .header{background:linear-gradient(135deg,#1a73e8,#0d47a1);
                        padding:32px 40px;text-align:center}
                .header h1{color:#fff;margin:0;font-size:22px}
                .header p{color:rgba(255,255,255,.85);margin:8px 0 0;font-size:14px}
                .body{padding:32px 40px}
                .info-card{background:#f8f9ff;border-left:4px solid #1a73e8;
                           border-radius:8px;padding:20px 24px;margin:20px 0}
                .row{display:flex;justify-content:space-between;
                     margin-bottom:10px;font-size:14px}
                .row:last-child{margin-bottom:0}
                .lbl{color:#888;font-weight:500}
                .val{color:#222;font-weight:700}
                .cover{background:#f9f9f9;border-radius:8px;padding:16px 20px;margin-top:20px}
                .cover h4{margin:0 0 10px;color:#555;font-size:13px;
                          text-transform:uppercase;letter-spacing:.5px}
                .cover p{margin:0;color:#444;font-size:14px;
                         line-height:1.6;font-style:italic}
                .cta{text-align:center;margin:32px 0 0}
                .btn{display:inline-block;background:#1a73e8;color:#fff;
                     padding:14px 36px;border-radius:8px;text-decoration:none;
                     font-weight:700;font-size:15px}
                .footer{background:#f4f6f9;padding:20px 40px;
                        text-align:center;font-size:12px;color:#aaa}
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>📬 New Proposal Received</h1>
                  <p>Someone is interested in your project</p>
                </div>
                <div class="body">
                  <p>A freelancer submitted a proposal for <strong>"%s"</strong>:</p>
                  <div class="info-card">
                    <div class="row"><span class="lbl">Project</span><span class="val">%s</span></div>
                    <div class="row"><span class="lbl">Category</span><span class="val">%s</span></div>
                    <div class="row"><span class="lbl">Proposed budget</span><span class="val">$%.2f</span></div>
                    <div class="row"><span class="lbl">Delivery time</span><span class="val">%d day(s)</span></div>
                  </div>
                  <div class="cover">
                    <h4>Cover letter preview</h4>
                    <p>"%s"</p>
                  </div>
                  <div class="cta">
                    <a href="http://localhost:4200/client-profile" class="btn">View Proposal →</a>
                  </div>
                </div>
                <div class="footer">
                  Prolance · © 2025 All rights reserved.
                </div>
              </div>
            </body>
            </html>
            """.formatted(projectTitle, projectTitle, projectCategory,
                proposedBudget, deliveryDays, preview);
    }
}