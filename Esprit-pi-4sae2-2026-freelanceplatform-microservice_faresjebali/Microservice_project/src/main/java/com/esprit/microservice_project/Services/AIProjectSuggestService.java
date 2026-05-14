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

    /** Prefer env GEMINI_API_KEY; Google AI Studio keys usually start with AIza… */
    @Value("${GEMINI_API_KEY:${gemini.api.key:}}")
    private String apiKey;

    /** Try stable model ids first (2.5 may be unavailable for some keys/regions). */
    private static final String[] GEMINI_MODELS = {
            "gemini-2.0-flash",
            "gemini-1.5-flash",
            "gemini-2.5-flash"
    };

    private static final String GEMINI_URL_PREFIX =
            "https://generativelanguage.googleapis.com/v1beta/models/";

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public ProjectAISuggestResponse suggest(String description, String duration) {
        if (apiKey == null || apiKey.isBlank()) {
            System.err.println("=== AI SUGGEST: gemini.api.key / GEMINI_API_KEY is empty — set a key from https://aistudio.google.com/apikey ===");
            return heuristicFallback(description);
        }

        String prompt = buildPrompt(description, duration);
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

        for (String model : GEMINI_MODELS) {
            String url = GEMINI_URL_PREFIX + model + ":generateContent?key=" + apiKey;
            try {
                ResponseEntity<String> response =
                        restTemplate.postForEntity(url, request, String.class);
                String rawText = extractText(response.getBody());
                return parseResponse(rawText, description);
            } catch (HttpClientErrorException e) {
                System.err.println("=== AI SUGGEST (" + model + ") 4xx: " + e.getStatusCode() + " — " + e.getResponseBodyAsString());
            } catch (HttpServerErrorException e) {
                System.err.println("=== AI SUGGEST (" + model + ") 5xx: " + e.getStatusCode());
            } catch (Exception e) {
                System.err.println("=== AI SUGGEST (" + model + ") error: " + e.getMessage());
            }
        }

        System.err.println("=== AI SUGGEST: all Gemini models failed — using heuristic fallback ===");
        return heuristicFallback(description);
    }

    private ProjectAISuggestResponse heuristicFallback(String description) {
        String title = deriveTitleFromDescription(description);
        String skills = guessSkillsFromDescription(description);
        String category = guessCategoryFromDescription(description);
        float min = 300f;
        float max = 1200f;
        return new ProjectAISuggestResponse(title, skills, category, min, max);
    }

    private static String deriveTitleFromDescription(String description) {
        if (description == null || description.isBlank()) {
            return "New project";
        }
        String oneLine = description.trim().replaceAll("\\s+", " ");
        int cap = Math.min(72, oneLine.length());
        String t = oneLine.substring(0, cap);
        if (oneLine.length() > cap) {
            t = t.replaceAll("\\s*\\S*$", "").trim();
            if (t.isEmpty()) {
                t = oneLine.substring(0, cap).trim() + "…";
            } else {
                t = t + "…";
            }
        }
        return t.isEmpty() ? "New project" : t;
    }

    private static String guessSkillsFromDescription(String description) {
        if (description == null || description.isBlank()) {
            return "Full-stack development, API design";
        }
        String d = description.toLowerCase();
        StringBuilder skills = new StringBuilder();
        if (d.contains("angular") || d.contains("react") || d.contains("vue")) skills.append("Frontend framework, ");
        if (d.contains("spring") || d.contains("node") || d.contains("backend")) skills.append("Backend development, ");
        if (d.contains("web") || d.contains("app")) skills.append("Web application, ");
        if (d.contains("mobile")) skills.append("Mobile development, ");
        if (d.contains("mysql") || d.contains("database") || d.contains("sql")) skills.append("SQL databases, ");
        if (d.contains("game") || d.contains("recommend")) skills.append("Recommendation systems, ");
        if (d.contains("machine learning") || d.contains("ml") || d.contains("ai")) skills.append("Machine learning, ");
        if (skills.length() == 0) {
            return "Web development, UX, APIs";
        }
        String s = skills.toString().replaceAll(",\\s*$", "");
        return s.length() > 200 ? s.substring(0, 200) : s;
    }

    private static String guessCategoryFromDescription(String description) {
        if (description == null || description.isBlank()) return "Web Development";
        String d = description.toLowerCase();
        if (d.contains("mobile") || d.contains("ios") || d.contains("android")) return "Mobile Development";
        if (d.contains("game")) return "Game development";
        if (d.contains("data") || d.contains("analytics")) return "Data & Analytics";
        return "Web Development";
    }

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

    private String extractText(String responseBody) throws Exception {
        JsonNode root = objectMapper.readTree(responseBody);
        JsonNode candidates = root.path("candidates");
        if (!candidates.isArray() || candidates.isEmpty()) {
            JsonNode feedback = root.path("promptFeedback");
            throw new IllegalStateException("No Gemini candidates; promptFeedback=" + feedback);
        }
        JsonNode textNode = candidates.get(0).path("content").path("parts").get(0).path("text");
        if (textNode.isMissingNode() || textNode.asText().isBlank()) {
            throw new IllegalStateException("Empty text in Gemini response");
        }
        return textNode.asText();
    }

    private ProjectAISuggestResponse parseResponse(String json, String descriptionFallback) throws Exception {
        String clean = json.replaceAll("(?is)```json\\s*", "").replaceAll("```", "").trim();
        int start = clean.indexOf('{');
        int end = clean.lastIndexOf('}');
        if (start >= 0 && end > start) {
            clean = clean.substring(start, end + 1);
        }
        JsonNode node = objectMapper.readTree(clean);

        String title = node.path("title").asText("");
        if (title.isBlank() || "untitled project".equalsIgnoreCase(title.trim())) {
            title = deriveTitleFromDescription(descriptionFallback);
        }
        String skills = node.path("skills").asText("");
        if (skills.isBlank()) {
            skills = guessSkillsFromDescription(descriptionFallback);
        }
        String category = node.path("category").asText("");
        if (category.isBlank()) {
            category = guessCategoryFromDescription(descriptionFallback);
        }
        float budMin = (float) node.path("budgetMin").asDouble(0);
        float budMax = (float) node.path("budgetMax").asDouble(0);
        if (budMin <= 0) budMin = 300f;
        if (budMax <= 0 || budMax < budMin) budMax = Math.max(budMin + 200f, 800f);

        return new ProjectAISuggestResponse(title, skills, category, budMin, budMax);
    }
}
