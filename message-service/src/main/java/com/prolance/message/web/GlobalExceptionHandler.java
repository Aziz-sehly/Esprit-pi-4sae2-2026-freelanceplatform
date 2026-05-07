package com.prolance.message.web;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.servlet.resource.NoResourceFoundException;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartException;
import org.springframework.web.server.ResponseStatusException;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;

import java.util.Map;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler({ MultipartException.class, MaxUploadSizeExceededException.class })
    public ResponseEntity<String> handleMultipartException(Exception e) {
        log.error("Multipart error: {}", e.getMessage(), e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Upload error: " + e.getMessage());
    }

    /** PrÃƒÂ©serve les statuts 4xx (404, 403) au lieu de les transformer en 500 */
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<String> handleResponseStatusException(ResponseStatusException e) {
        log.warn("ResponseStatusException: {} - {}", e.getStatusCode(), e.getReason());
        return ResponseEntity.status(e.getStatusCode())
                .body(e.getReason() != null ? e.getReason() : e.getStatusCode().toString());
    }

    /** ParamÃƒÂ¨tre requis manquant (ex: userId ou otherUserId absent) Ã¢â€ â€™ 400 */
    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<Map<String, String>> handleMissingParam(MissingServletRequestParameterException e) {
        String msg = String.format("ParamÃƒÂ¨tre requis manquant: '%s' (type: %s)", e.getParameterName(), e.getParameterType());
        log.warn("Missing parameter: {}", msg);
        return ResponseEntity.badRequest()
                .body(Map.of("error", msg, "parameter", e.getParameterName()));
    }

    /** ParamÃƒÂ¨tres invalides (ex: userId=abc, nombre trop grand pour Integer) Ã¢â€ â€™ 400 */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, String>> handleTypeMismatch(MethodArgumentTypeMismatchException e) {
        String param = e.getName();
        String value = e.getValue() != null ? String.valueOf(e.getValue()) : "null";
        String msg = String.format("ParamÃƒÂ¨tre invalide '%s'='%s': valeur attendue de type %s",
                param, value, e.getRequiredType() != null ? e.getRequiredType().getSimpleName() : "inconnu");
        log.warn("MethodArgumentTypeMismatch: {}", msg);
        return ResponseEntity.badRequest()
                .body(Map.of("error", msg, "parameter", param, "value", value));
    }

    /** Validation @Valid ÃƒÂ©chouÃƒÂ©e sur @RequestBody Ã¢â€ â€™ 400 */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException e) {
        var errors = e.getBindingResult().getFieldErrors().stream()
                .collect(Collectors.toMap(f -> f.getField(), f -> f.getDefaultMessage() != null ? f.getDefaultMessage() : "invalide"));
        log.warn("Validation failed: {}", errors);
        return ResponseEntity.badRequest().body(Map.of("error", "Validation ÃƒÂ©chouÃƒÂ©e", "details", errors));
    }

    /** Validation @Validated sur @RequestParam/@PathVariable (ex: @Min(1), contractId=0) Ã¢â€ â€™ 400 */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<Map<String, Object>> handleConstraintViolation(ConstraintViolationException e) {
        var errors = e.getConstraintViolations().stream()
                .collect(Collectors.toMap(
                        v -> v.getPropertyPath().toString(),
                        ConstraintViolation::getMessage));
        log.warn("Constraint violation: {}", errors);
        return ResponseEntity.badRequest().body(Map.of("error", "ParamÃƒÂ¨tres invalides", "details", errors));
    }

        @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<String> handleNoResource(NoResourceFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Not found: " + ex.getMessage());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<String> handleGenericException(Exception e) {
        log.error("Unexpected error: {}", e.getMessage(), e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error: " + e.getMessage());
    }
}
