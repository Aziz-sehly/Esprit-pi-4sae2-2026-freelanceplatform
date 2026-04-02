package com.prolance.message.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.Map;

/**
 * Translation service using MyMemory API (free, no key required).
 * Fallback: returns original text if API fails.
 */
@Service
public class TranslationService {

    private static final Logger log = LoggerFactory.getLogger(TranslationService.class);
    private static final String MYMEMORY_URL = "https://api.mymemory.translated.net/get?q=%s&langpair=%s|%s";
    private final RestTemplate restTemplate = new RestTemplate();

    public String translate(String text, String fromLang, String toLang) {
        if (text == null || text.isBlank()) return text;
        if ("en".equalsIgnoreCase(fromLang) && "en".equalsIgnoreCase(toLang)) return text;
        if (text.length() > 500) text = text.substring(0, 500); // API limit
        try {
            String encoded = java.net.URLEncoder.encode(text, StandardCharsets.UTF_8);
            String from = "auto".equalsIgnoreCase(fromLang) ? ("en".equalsIgnoreCase(toLang) ? "fr" : "en") : fromLang;
            String result = callMyMemory(encoded, from, toLang);
            if (result != null && !result.isBlank()) return result;
        } catch (Exception e) {
            log.warn("Translation failed for text length {}: {}", text.length(), e.getMessage());
        }
        return text;
    }

    private String callMyMemory(String encoded, String from, String to) {
        try {
            String url = String.format(MYMEMORY_URL, encoded, from, to);
            @SuppressWarnings("unchecked")
            Map<String, Object> resp = restTemplate.getForObject(URI.create(url), Map.class);
            if (resp != null) {
                Object responseData = resp.get("responseData");
                if (responseData instanceof Map<?, ?> dataMap) {
                    Object translated = dataMap.get("translatedText");
                    if (translated != null && !translated.toString().isBlank()) {
                        return translated.toString().trim();
                    }
                }
            }
        } catch (Exception e) {
            log.debug("MyMemory API call failed: {}", e.getMessage());
        }
        return null;
    }
}
