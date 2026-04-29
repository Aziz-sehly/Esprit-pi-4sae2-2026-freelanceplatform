package org.example.reviewsservice.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "*")
public class AiController {

    @Value("${groq.api.key}")
    private String groqApiKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String GROQ_URL =
            "https://api.groq.com/openai/v1/chat/completions";

    @PostMapping("/summarize")
    public ResponseEntity<Map<String, String>> summarize(@RequestBody Map<String, Object> body) {
        try {

            String reviewsText = (String) body.get("reviewsText");
            int reviewCount = (int) body.getOrDefault("reviewCount", 0);

            String prompt =
                    "You are an AI assistant analyzing user reviews for a freelance platform called Talently. "
                            + "Summarize the following " + reviewCount + " reviews in 3-5 sentences. "
                            + "Mention overall sentiment, common praise, any recurring complaints, average rating context, "
                            + "and end with a one-line overall verdict.\n\nReviews:\n"
                            + reviewsText;

            String reply = callGroq(prompt);

            return ResponseEntity.ok(Map.of("summary", reply));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "AI service unavailable: " + e.getMessage()));
        }
    }

    @PostMapping("/ask")
    public ResponseEntity<Map<String, String>> ask(@RequestBody Map<String, Object> body) {
        try {

            String question = (String) body.get("question");
            String reviewsText = (String) body.get("reviewsText");

            String prompt =
                    "You are an AI assistant analyzing reviews for a freelance platform called Talently. "
                            + "Based on the following reviews, answer this question concisely: \""
                            + question + "\"\n\nReviews:\n"
                            + reviewsText;

            String reply = callGroq(prompt);

            return ResponseEntity.ok(Map.of("answer", reply));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "AI service unavailable: " + e.getMessage()));
        }
    }

    private String callGroq(String prompt) {

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(groqApiKey);

        Map<String, Object> requestBody = Map.of(
                "model", "llama-3.1-8b-instant",
                "messages", List.of(
                        Map.of(
                                "role", "user",
                                "content", prompt
                        )
                ),
                "temperature", 0.7
        );

        HttpEntity<Map<String, Object>> request =
                new HttpEntity<>(requestBody, headers);

        // ✅ FIX: avoid JsonNode deserialization crash
        ResponseEntity<String> response = restTemplate.postForEntity(
                GROQ_URL,
                request,
                String.class
        );

        try {
            JsonNode root = objectMapper.readTree(response.getBody());

            return root
                    .path("choices").get(0)
                    .path("message")
                    .path("content")
                    .asText("Could not generate a response.");

        } catch (Exception parseError) {
            return "Error parsing AI response.";
        }
    }
}