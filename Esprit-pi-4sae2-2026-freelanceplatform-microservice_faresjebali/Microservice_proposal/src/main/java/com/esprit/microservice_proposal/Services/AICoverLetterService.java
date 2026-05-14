package com.esprit.microservice_proposal.Services;

import com.esprit.microservice_proposal.DTO.CoverLetterRequest;
import com.esprit.microservice_proposal.DTO.CoverLetterResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@Slf4j
public class AICoverLetterService {

    @Value("${GEMINI_API_KEY:${gemini.api.key:}}")
    private String apiKey;

    private static final String[] GEMINI_MODELS = {
            "gemini-2.0-flash",
            "gemini-1.5-flash",
            "gemini-2.5-flash"
    };

    private static final String GEMINI_URL_PREFIX =
            "https://generativelanguage.googleapis.com/v1beta/models/";

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public CoverLetterResponse generate(CoverLetterRequest req) {
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("GEMINI_API_KEY / gemini.api.key is empty; using template cover letter. Get a key at https://aistudio.google.com/apikey");
            return new CoverLetterResponse(fallbackCoverLetter(req));
        }

        String prompt = buildPrompt(req);
        Map<String, Object> body = Map.of(
                "contents", List.of(Map.of(
                        "parts", List.of(Map.of("text", prompt))
                ))
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        for (String model : GEMINI_MODELS) {
            String url = GEMINI_URL_PREFIX + model + ":generateContent?key=" + apiKey;
            try {
                ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
                String text = extractText(response.getBody());
                if (text != null && !text.isBlank()) {
                    return new CoverLetterResponse(text.trim());
                }
            } catch (HttpClientErrorException e) {
                log.warn("Gemini {} HTTP {}: {}", model, e.getStatusCode(), truncate(e.getResponseBodyAsString(), 400));
            } catch (HttpServerErrorException e) {
                log.warn("Gemini {} server error: {}", model, e.getStatusCode());
            } catch (Exception e) {
                log.warn("Gemini {} failed: {}", model, e.getMessage());
            }
        }

        log.warn("All Gemini models failed; using template cover letter.");
        return new CoverLetterResponse(fallbackCoverLetter(req));
    }

    private static String truncate(String s, int max) {
        if (s == null) return "";
        return s.length() <= max ? s : s.substring(0, max) + "…";
    }

    private String extractText(String responseBody) throws Exception {
        JsonNode root = objectMapper.readTree(responseBody);
        JsonNode candidates = root.path("candidates");
        if (!candidates.isArray() || candidates.isEmpty()) {
            log.debug("No candidates: {}", root.path("promptFeedback"));
            return null;
        }
        JsonNode textNode = candidates.get(0).path("content").path("parts").get(0).path("text");
        if (textNode.isMissingNode() || textNode.asText().isBlank()) {
            return null;
        }
        return textNode.asText();
    }

    private String fallbackCoverLetter(CoverLetterRequest req) {
        String skills = Optional.ofNullable(req.getFreelancerSkills()).filter(s -> !s.isBlank()).orElse("relevant technical skills");
        String title = Optional.ofNullable(req.getProjectTitle()).filter(s -> !s.isBlank()).orElse("this project");
        String desc = Optional.ofNullable(req.getProjectDescription()).orElse("");
        if (desc.length() > 280) {
            desc = desc.substring(0, 277).trim() + "…";
        }
        if (desc.isBlank()) {
            desc = "the scope you described";
        }
        return String.format(
                "I'm very interested in %s. %s "
                        + "My background includes %s, and I'm confident I can deliver quality work aligned with your timeline and budget. "
                        + "I'd welcome a short call to align on requirements and next steps.",
                title, desc, skills);
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
