package com.prolance.message.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Censors banned words in message content.
 * Words are replaced with asterisks (e.g. "***").
 */
@Service
public class CensorService {

    private static final Logger log = LoggerFactory.getLogger(CensorService.class);

    @Value("${app.censor.enabled:true}")
    private boolean enabled;

    @Value("${app.censor.banned-words:}")
    private List<String> bannedWords;

    @Value("${app.censor.replacement:***}")
    private String replacement;

    /**
     * Applies censorship to the given text.
     * Replaces banned words (case-insensitive) with the configured replacement.
     *
     * @param text the raw message content
     * @return censored text, or original if censorship is disabled or no banned words
     */
    public String censor(String text) {
        if (text == null || text.isBlank()) return text;
        if (!enabled || bannedWords == null || bannedWords.isEmpty()) return text;

        String result = text;
        for (String word : bannedWords) {
            if (word == null || word.isBlank()) continue;
            try {
                String regex = "(?i)\\b" + Pattern.quote(word.trim()) + "\\b";
                result = result.replaceAll(regex, Matcher.quoteReplacement(replacement));
            } catch (Exception e) {
                log.warn("Censor regex failed for word '{}': {}", word, e.getMessage());
            }
        }
        return result;
    }
}
