package org.example.reviewsservice.controller;

import org.example.reviewsservice.entity.Review;
<<<<<<< HEAD
=======
import org.example.reviewsservice.entity.ReviewEditHistory;
>>>>>>> b0248089 (fonctions (pas encore integration user))
import org.example.reviewsservice.service.ReviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

<<<<<<< HEAD
import java.util.List;
import java.util.Map;

// @RestController means this class handles incoming HTTP requests and returns JSON responses
// It combines @Controller (handles requests) and @ResponseBody (returns JSON automatically)
@RestController

// @RequestMapping sets the base URL for all endpoints in this class
// Every endpoint here starts with /api/reviews
@RequestMapping("/api/reviews")

// @CrossOrigin(origins = "*") allows requests from ANY domain (including our Angular app on localhost:4200)
// Without this, the browser would block requests from Angular to Spring Boot for security reasons
// This is called CORS (Cross-Origin Resource Sharing)
@CrossOrigin(origins = "*")
public class ReviewController {

    // Spring automatically injects the ReviewService — we never create it manually
=======
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
@CrossOrigin(origins = "*")
public class ReviewController {

>>>>>>> b0248089 (fonctions (pas encore integration user))
    @Autowired
    private ReviewService reviewService;

    // ── GET /api/reviews ──────────────────────────────────────────────
<<<<<<< HEAD
    // Returns ALL reviews as a JSON array
    // Example Postman: GET http://localhost:8081/api/reviews
=======
>>>>>>> b0248089 (fonctions (pas encore integration user))
    @GetMapping
    public List<Review> getAllReviews() {
        return reviewService.getAllReviews();
    }

    // ── GET /api/reviews/{id} ─────────────────────────────────────────
<<<<<<< HEAD
    // Returns a single review by its ID
    // @PathVariable extracts the {id} from the URL (e.g. /api/reviews/3 → id = 3)
    // ResponseEntity lets us control the HTTP status code:
    //   - 200 OK if found, 404 Not Found if it doesn't exist
    // Example Postman: GET http://localhost:8081/api/reviews/3
    @GetMapping("/{id}")
    public ResponseEntity<Review> getReviewById(@PathVariable Long id) {
        return reviewService.getReviewById(id)
                .map(ResponseEntity::ok)              // if found → return 200 with the review
                .orElse(ResponseEntity.notFound().build()); // if not found → return 404
    }

    // ── POST /api/reviews ─────────────────────────────────────────────
    // Creates a new review
    // @RequestBody tells Spring to convert the incoming JSON body into a Review Java object
    // Example Postman: POST http://localhost:8081/api/reviews
    // Body (JSON): { "author": "Alice", "rating": 5, "content": "Great!", "reviewReason": "Quality of work delivered" }
=======
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

    // ── NEW: GET /api/reviews/{id}/history ────────────────────────────
    // Returns all edit history entries for a review, newest-first.
    // Each entry contains oldContent, newContent, oldRating, newRating,
    // editedBy, and editedAt so the frontend can render a full diff timeline.
    // Example: GET http://localhost:8081/api/reviews/3/history
    @GetMapping("/{id}/history")
    public ResponseEntity<List<ReviewEditHistory>> getReviewHistory(@PathVariable Long id) {
        List<ReviewEditHistory> history = reviewService.getReviewHistory(id);
        return ResponseEntity.ok(history);
    }

    // ── POST /api/reviews ─────────────────────────────────────────────
>>>>>>> b0248089 (fonctions (pas encore integration user))
    @PostMapping
    public Review createReview(@RequestBody Review review) {
        return reviewService.createReview(review);
    }

    // ── PUT /api/reviews/{id} ─────────────────────────────────────────
<<<<<<< HEAD
    // Updates an existing review — replaces all its fields with the new data
    // @PathVariable gets the ID from the URL, @RequestBody gets the new data from the request body
    // Returns 200 OK with updated review, or 404 if the ID doesn't exist
    // Example Postman: PUT http://localhost:8081/api/reviews/3
    // Body (JSON): { "author": "Alice", "rating": 4, "content": "Updated!", "reviewReason": "Value for money" }
=======
    // Saves a history snapshot then applies the update.
>>>>>>> b0248089 (fonctions (pas encore integration user))
    @PutMapping("/{id}")
    public ResponseEntity<Review> updateReview(@PathVariable Long id, @RequestBody Review review) {
        try {
            return ResponseEntity.ok(reviewService.updateReview(id, review));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // ── DELETE /api/reviews/{id} ──────────────────────────────────────
<<<<<<< HEAD
    // Deletes a review by ID
    // Returns 204 No Content (success, but nothing to return in the body)
    // Example Postman: DELETE http://localhost:8081/api/reviews/3
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReview(@PathVariable Long id) {
        reviewService.deleteReview(id);
        return ResponseEntity.noContent().build(); // 204 No Content
    }

    // ── GET /api/reviews/average ──────────────────────────────────────
    // Returns the average star rating across all reviews
    // Example response: { "averageRating": 4.3 }
    // Example Postman: GET http://localhost:8081/api/reviews/average
    @GetMapping("/average")
    public ResponseEntity<Map<String, Double>> getAverageRating() {
        // Map.of() creates a simple key-value map: {"averageRating": 4.3}
=======
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
>>>>>>> b0248089 (fonctions (pas encore integration user))
        return ResponseEntity.ok(Map.of("averageRating", reviewService.getAverageRating()));
    }

    // ── GET /api/reviews/stats ────────────────────────────────────────
<<<<<<< HEAD
    // Returns statistics used by the back office Statistics tab
    // Example response:
    // {
    //   "ratingDistribution": { "1": 2, "2": 0, "3": 5, "4": 10, "5": 18 },
    //   "reasonDistribution": { "Quality of work delivered": 12, "Communication": 8 }
    // }
    // Example Postman: GET http://localhost:8081/api/reviews/stats
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        Map<String, Object> stats = Map.of(
                "ratingDistribution", reviewService.getRatingDistribution(),
                "reasonDistribution", reviewService.getReasonDistribution()
        );
=======
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("ratingDistribution",    reviewService.getRatingDistribution());
        stats.put("reasonDistribution",    reviewService.getReasonDistribution());
        stats.put("sentimentDistribution", reviewService.getSentimentDistribution());
>>>>>>> b0248089 (fonctions (pas encore integration user))
        return ResponseEntity.ok(stats);
    }

    // ── POST /api/reviews/{id}/translate ─────────────────────────────
<<<<<<< HEAD
    // Translates the content of a review into another language
    // @RequestParam reads a query parameter from the URL (e.g. ?targetLang=fr)
    // Example Postman: POST http://localhost:8081/api/reviews/3/translate?targetLang=fr
    // Returns: { "translatedText": "Excellent travail!", "originalContent": "Great work!" }
=======
>>>>>>> b0248089 (fonctions (pas encore integration user))
    @PostMapping("/{id}/translate")
    public ResponseEntity<?> translateReview(
            @PathVariable Long id,
            @RequestParam String targetLang) {
        return reviewService.getReviewById(id)
                .map(review -> {
                    String translated = reviewService.translateText(
                            review.getContent(),
<<<<<<< HEAD
                            // Use the review's stored language, default to "en" if not set
=======
>>>>>>> b0248089 (fonctions (pas encore integration user))
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
}