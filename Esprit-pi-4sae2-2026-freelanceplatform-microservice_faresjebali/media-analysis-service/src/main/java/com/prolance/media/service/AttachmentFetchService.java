package com.prolance.media.service;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.util.Locale;

@Service
public class AttachmentFetchService {

    private final RestTemplate restTemplate;

    @Value("${app.media.max-download-bytes:25165824}")
    private int maxDownloadBytes;

    public AttachmentFetchService(@Qualifier("loadBalancedRestTemplate") RestTemplate loadBalancedRestTemplate) {
        this.restTemplate = loadBalancedRestTemplate;
    }

    /**
     * Télécharge le fichier depuis message-service via Eureka ({@code http://message-service/...}).
     */
    public byte[] fetchBytes(String resourcePath) {
        String filename = extractAttachmentFilename(resourcePath);
        String url = "http://message-service/api/messages/attachments/" + filename;
        ResponseEntity<byte[]> resp = restTemplate.exchange(
                URI.create(url),
                HttpMethod.GET,
                null,
                byte[].class
        );
        byte[] body = resp.getBody();
        if (body == null) {
            return new byte[0];
        }
        if (body.length > maxDownloadBytes) {
            throw new IllegalStateException("Attachment exceeds max download size");
        }
        return body;
    }

    static String extractAttachmentFilename(String resourcePath) {
        if (resourcePath == null || resourcePath.isBlank()) {
            throw new IllegalArgumentException("resourcePath is blank");
        }
        String p = resourcePath.trim();
        int q = p.indexOf('?');
        if (q >= 0) {
            p = p.substring(0, q);
        }
        String prefix = "/messages/attachments/";
        String lower = p.toLowerCase(Locale.ROOT);
        if (lower.contains(prefix)) {
            int idx = lower.indexOf(prefix);
            return p.substring(idx + prefix.length());
        }
        int slash = p.lastIndexOf('/');
        if (slash >= 0 && slash < p.length() - 1) {
            return p.substring(slash + 1);
        }
        return p;
    }
}
