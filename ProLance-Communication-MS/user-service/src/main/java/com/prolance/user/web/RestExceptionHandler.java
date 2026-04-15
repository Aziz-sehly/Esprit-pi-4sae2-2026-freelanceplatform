package com.prolance.user.web;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Ensures {@link ResponseStatusException} always returns JSON with a non-empty {@code message}
 * so the Angular client can show login/register errors reliably (some setups omit {@code message}).
 */
@RestControllerAdvice
public class RestExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, Object> body = new LinkedHashMap<>();
        String msg = ex.getBindingResult().getFieldErrors().stream()
                .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
                .collect(Collectors.joining("; "));
        body.put("status", 400);
        body.put("message", msg.isBlank() ? "Validation error" : msg);
        return ResponseEntity.badRequest().body(body);
    }

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
