package org.example.forumservice.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
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

    private static final String FORUM_SYSTEM_PROMPT =
            "You are an AI Assistant embedded in Talently, a freelance marketplace platform. " +
                    "Your primary roles are:\n" +
                    "1. Help clients find and evaluate the right freelancers for their projects.\n" +
                    "2. Help freelancers solve technical and computer science problems they encounter in their work.\n" +
                    "3. Answer questions about freelancing best practices, proposals, rates, and client relationships.\n" +
                    "4. Help users navigate and get the most out of the Talently platform.\n\n" +
                    "Be concise, practical, and friendly. Format code with backticks. Use bullet points for lists. " +
                    "If asked about something unrelated to freelancing or tech, you can still help — you are a general AI assistant.";

    @PostMapping("/chat")
    public ResponseEntity<Map<String, String>> chat(@RequestBody Map<String, Object> body) {
        try {

            List<Map<String, String>> historyMessages =
                    objectMapper.convertValue(
                            body.get("messages"),
                            objectMapper.getTypeFactory()
                                    .constructCollectionType(List.class, Map.class)
                    );

            List<Map<String, Object>> messages = new ArrayList<>();

            // System prompt
            messages.add(Map.of(
                    "role", "system",
                    "content", FORUM_SYSTEM_PROMPT
            ));

            // Conversation history
            for (Map<String, String> msg : historyMessages) {

                String role = msg.get("role");
                if (role == null) role = "user";

                if (role.equals("assistant")) role = "assistant";
                else role = "user";

                messages.add(Map.of(
                        "role", role,
                        "content", msg.get("content")
                ));
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(groqApiKey);

            Map<String, Object> requestBody = Map.of(
                    "model", "llama-3.1-8b-instant",
                    "messages", messages,
                    "temperature", 0.7
            );

            HttpEntity<Map<String, Object>> request =
                    new HttpEntity<>(requestBody, headers);

            // ✅ FIX: use String instead of JsonNode
            ResponseEntity<String> response = restTemplate.postForEntity(
                    GROQ_URL,
                    request,
                    String.class
            );

            // Parse manually (safe + stable)
            JsonNode root = objectMapper.readTree(response.getBody());

            String reply = root
                    .path("choices").get(0)
                    .path("message")
                    .path("content")
                    .asText("Sorry, I could not generate a response.");

            return ResponseEntity.ok(Map.of("reply", reply));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "AI service unavailable: " + e.getMessage()));
        }
    }
}