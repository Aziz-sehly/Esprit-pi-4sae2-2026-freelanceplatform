package com.esprit.microservice_project.Services;

import com.esprit.microservice_project.DTO.ProjectAISuggestResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
public class AIProjectSuggestService {

    @Value("${gemini.api.key}")
    private String apiKey;

    // Gemini 2.0 Flash — gratuit et rapide
    private static final String GEMINI_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=";

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper  = new ObjectMapper();

    public ProjectAISuggestResponse suggest(String description, String duration) {

        String prompt = buildPrompt(description, duration);

        // Corps de la requête Gemini
        Map<String, Object> body = Map.of(
                "contents", List.of(
                        Map.of("parts", List.of(
                                Map.of("text", prompt)
                        ))
                )
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
        String url = GEMINI_URL + apiKey;

        System.out.println("=== AI SUGGEST (Gemini): calling API ===");
        System.out.println("=== API KEY (first 10 chars): " +
                (apiKey != null ? apiKey.substring(0, Math.min(10, apiKey.length())) : "NULL") + "... ===");

        try {
            ResponseEntity<String> response =
                    restTemplate.postForEntity(url, request, String.class);

            System.out.println("=== AI SUGGEST: HTTP Status = " + response.getStatusCode() + " ===");
            System.out.println("=== AI SUGGEST: Raw response = " + response.getBody() + " ===");

            String rawText = extractText(response.getBody());
            System.out.println("=== AI SUGGEST: Extracted text = " + rawText + " ===");

            return parseResponse(rawText);

        } catch (HttpClientErrorException e) {
            System.err.println("=== AI SUGGEST ERROR (4xx) ===");
            System.err.println("Status : " + e.getStatusCode());
            System.err.println("Body   : " + e.getResponseBodyAsString());
            e.printStackTrace();
        } catch (HttpServerErrorException e) {
            System.err.println("=== AI SUGGEST ERROR (5xx) ===");
            System.err.println("Status : " + e.getStatusCode());
            System.err.println("Body   : " + e.getResponseBodyAsString());
            e.printStackTrace();
        } catch (Exception e) {
            System.err.println("=== AI SUGGEST ERROR (general) ===");
            System.err.println("Type    : " + e.getClass().getName());
            System.err.println("Message : " + e.getMessage());
            e.printStackTrace();
        }

        System.out.println("=== AI SUGGEST: returning fallback values ===");
        return new ProjectAISuggestResponse("Untitled Project", "","", 500f, 2000f);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private String buildPrompt(String description, String duration) {
        return """
        You are a freelance platform assistant for a Tunisian/North African market.
        Based on the project description and duration below,
        suggest appropriate values for: title, skills (comma-separated), 
        budget_min (USD), budget_max (USD).

        Important: Budgets should reflect Tunisian freelance market rates.
        Typical projects range from $100 to $800 USD maximum.

        Description: %s
        Duration: %s

        Respond ONLY with a valid JSON object (no markdown, no explanation):
        {
          "title": "...",
          "skills": "skill1, skill2, skill3",
          "category": "Web Development",
          "budgetMin": 150,
          "budgetMax": 500
        }
        """.formatted(description, duration);
    }

    /**
     * Gemini response structure:
     * { "candidates": [ { "content": { "parts": [ { "text": "..." } ] } } ] }
     */
    private String extractText(String responseBody) throws Exception {
        JsonNode root = objectMapper.readTree(responseBody);
        return root
                .path("candidates").get(0)
                .path("content")
                .path("parts").get(0)
                .path("text").asText();
    }

    private ProjectAISuggestResponse parseResponse(String json) throws Exception {
        String clean = json.replaceAll("```json", "").replaceAll("```", "").trim();
        JsonNode node = objectMapper.readTree(clean);

        String title    = node.path("title").asText("Untitled Project");
        String skills   = node.path("skills").asText("");
        String category = node.path("category").asText("");   // ← AJOUTER
        float  budMin   = (float) node.path("budgetMin").asDouble(500);
        float  budMax   = (float) node.path("budgetMax").asDouble(2000);

        return new ProjectAISuggestResponse(title, skills, category, budMin, budMax);
    }
}