package com.esprit.microservice_proposal.Services;

import com.esprit.microservice_proposal.DTO.CoverLetterRequest;
import com.esprit.microservice_proposal.DTO.CoverLetterResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class AICoverLetterService {

    @Value("${gemini.api.key}")
    private String apiKey;

    private static final String GEMINI_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=";

    private final RestTemplate restTemplate = new RestTemplate();

    public CoverLetterResponse generate(CoverLetterRequest req) {
        String prompt = buildPrompt(req);
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> body = Map.of(
                    "contents", List.of(Map.of(
                            "parts", List.of(Map.of("text", prompt))
                    ))
            );

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(
                    GEMINI_URL + apiKey, entity, Map.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                var candidates = (List<?>) response.getBody().get("candidates");
                if (candidates != null && !candidates.isEmpty()) {
                    var content = (Map<?, ?>) ((Map<?, ?>) candidates.get(0)).get("content");
                    var parts   = (List<?>) content.get("parts");
                    String text = (String) ((Map<?, ?>) parts.get(0)).get("text");
                    return new CoverLetterResponse(text.trim());
                }
            }
        } catch (Exception e) {
            log.error("Gemini AI error: {}", e.getMessage());
        }
        return new CoverLetterResponse("Could not generate cover letter. Please write manually.");
    }

    private String buildPrompt(CoverLetterRequest req) {
        return String.format("""
            You are an expert freelance cover letter writer.
            Write a professional, compelling, and personalized cover letter for a freelancer applying to a project.
            
            FREELANCER SKILLS & EXPERIENCE:
            %s
            
            PROJECT DETAILS:
            - Title: %s
            - Category: %s
            - Description: %s
            - Budget: $%.0f - $%.0f
            - Duration: %s
            
            INSTRUCTIONS:
            - Maximum 200 words
            - Start directly with a strong opening (no "Dear" or "Hello")
            - Highlight relevant skills from the freelancer profile
            - Show understanding of the project
            - End with a clear call to action
            - Professional but not robotic tone
            - Do NOT include placeholders like [Your Name]
            
            Write ONLY the cover letter text, nothing else.
            """,
                req.getFreelancerSkills(),
                req.getProjectTitle(),
                req.getProjectCategory(),
                req.getProjectDescription(),
                req.getProjectBudgetMin() != null ? req.getProjectBudgetMin() : 0,
                req.getProjectBudgetMax() != null ? req.getProjectBudgetMax() : 0,
                req.getProjectDuration()
        );
    }
}