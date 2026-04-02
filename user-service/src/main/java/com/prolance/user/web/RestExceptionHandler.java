package com.prolance.user.web;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Ensures {@link ResponseStatusException} always returns JSON with a non-empty {@code message}
 * so the Angular client can show login/register errors reliably (some setups omit {@code message}).
 */
@RestControllerAdvice
public class RestExceptionHandler {

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleResponseStatus(ResponseStatusException ex) {
        Map<String, Object> body = new LinkedHashMap<>();
        var status = ex.getStatusCode();
        body.put("status", status.value());
        String reason = ex.getReason();
        body.put("message", reason != null && !reason.isBlank()
                ? reason
                : status.toString());
        return ResponseEntity.status(status).body(body);
    }
}
