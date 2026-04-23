package com.prolance.message.web;

import com.prolance.message.service.TranslationService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/messages")
public class TranslationController {

    private final TranslationService translationService;

    public TranslationController(TranslationService translationService) {
        this.translationService = translationService;
    }

    @PostMapping("/translate")
    public Map<String, String> translate(@RequestParam String text,
                                         @RequestParam(defaultValue = "auto") String from,
                                         @RequestParam(defaultValue = "en") String to) {
        String translated = translationService.translate(text, from, to);
        return Map.of("original", text, "translated", translated != null ? translated : text);
    }
}
