package org.example.reviewsservice.controller;

import org.example.reviewsservice.entity.Review;
import org.example.reviewsservice.entity.ReviewEditHistory;
import org.example.reviewsservice.security.JwtUtils;
import org.example.reviewsservice.service.ReviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
@CrossOrigin(origins = "*")
public class ReviewController {

    @Autowired
    private ReviewService reviewService;

    @Autowired
    private JwtUtils jwtUtils;

    // ── GET /api/reviews ──────────────────────────────────────────────
    @GetMapping
    public List<Review> getAllReviews() {
        return reviewService.getAllReviews();
    }

    // ── GET /api/reviews/{id} ─────────────────────────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<Review> getReviewById(@PathVariable Long id) {
        return reviewService.getReviewById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ── GET /api/reviews/search?q=... ─────────────────────────────────
    @GetMapping("/search")
    public List<Review> searchReviews(@RequestParam(defaultValue = "") String q) {
        return reviewService.searchReviews(q);
    }

    // ── GET /api/reviews/{id}/history ─────────────────────────────────
    @GetMapping("/{id}/history")
    public ResponseEntity<List<ReviewEditHistory>> getReviewHistory(@PathVariable Long id) {
        return ResponseEntity.ok(reviewService.getReviewHistory(id));
    }

    /**
     * POST /api/reviews
     * Requires: Authorization: Bearer <token>
     * Body (JSON): { "content": "...", "rating": 5, "reviewReason": "Quality", "language": "en" }
     * The author is resolved from the JWT — do NOT send "author" in the body.
     */
    @PostMapping
    public ResponseEntity<?> createReview(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Review review) {
        try {
            Long userId = extractUserId(authHeader);
            return ResponseEntity.ok(reviewService.createReview(userId, review));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    // ── PUT /api/reviews/{id} ─────────────────────────────────────────
    @PutMapping("/{id}")
    public ResponseEntity<Review> updateReview(@PathVariable Long id, @RequestBody Review review) {
        try {
            return ResponseEntity.ok(reviewService.updateReview(id, review));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // ── DELETE /api/reviews/{id} ──────────────────────────────────────
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReview(@PathVariable Long id) {
        reviewService.deleteReview(id);
        return ResponseEntity.noContent().build();
    }

    // ── POST /api/reviews/{id}/bookmark ──────────────────────────────
    @PostMapping("/{id}/bookmark")
    public ResponseEntity<Review> toggleBookmark(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(reviewService.toggleBookmark(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // ── POST /api/reviews/{id}/helpful ───────────────────────────────
    @PostMapping("/{id}/helpful")
    public ResponseEntity<Review> addHelpfulVote(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(reviewService.addHelpfulVote(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // ── GET /api/reviews/average ──────────────────────────────────────
    @GetMapping("/average")
    public ResponseEntity<Map<String, Double>> getAverageRating() {
        return ResponseEntity.ok(Map.of("averageRating", reviewService.getAverageRating()));
    }

    // ── GET /api/reviews/stats ────────────────────────────────────────
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("ratingDistribution",    reviewService.getRatingDistribution());
        stats.put("reasonDistribution",    reviewService.getReasonDistribution());
        stats.put("sentimentDistribution", reviewService.getSentimentDistribution());
        return ResponseEntity.ok(stats);
    }

    // ── POST /api/reviews/{id}/translate ─────────────────────────────
    @PostMapping("/{id}/translate")
    public ResponseEntity<?> translateReview(
            @PathVariable Long id,
            @RequestParam String targetLang) {
        return reviewService.getReviewById(id)
                .map(review -> {
                    String translated = reviewService.translateText(
                            review.getContent(),
                            review.getLanguage() != null ? review.getLanguage() : "en",
                            targetLang
                    );
                    return ResponseEntity.ok((Object) Map.of(
                            "translatedText", translated,
                            "originalContent", review.getContent()
                    ));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // ── Private helper ────────────────────────────────────────────────

    private Long extractUserId(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new IllegalArgumentException("Missing or invalid Authorization header");
        }
        return jwtUtils.extractUserId(authHeader.substring(7));
    }
}