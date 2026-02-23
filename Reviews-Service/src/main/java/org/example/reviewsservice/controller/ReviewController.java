package org.example.reviewsservice.controller;

import org.example.reviewsservice.entity.Review;
import org.example.reviewsservice.service.ReviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
@CrossOrigin(origins = "*")
public class ReviewController {

    @Autowired
    private ReviewService reviewService;

    // GET all reviews
    @GetMapping
    public List<Review> getAllReviews() {
        return reviewService.getAllReviews();
    }

    // GET single review
    @GetMapping("/{id}")
    public ResponseEntity<Review> getReviewById(@PathVariable Long id) {
        return reviewService.getReviewById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // POST create review
    @PostMapping
    public Review createReview(@RequestBody Review review) {
        return reviewService.createReview(review);
    }

    // PUT update review
    @PutMapping("/{id}")
    public ResponseEntity<Review> updateReview(@PathVariable Long id, @RequestBody Review review) {
        try {
            return ResponseEntity.ok(reviewService.updateReview(id, review));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // DELETE review (admin)
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReview(@PathVariable Long id) {
        reviewService.deleteReview(id);
        return ResponseEntity.noContent().build();
    }

    // GET average rating
    @GetMapping("/average")
    public ResponseEntity<Map<String, Double>> getAverageRating() {
        return ResponseEntity.ok(Map.of("averageRating", reviewService.getAverageRating()));
    }

    // POST translate a review's content via backend (avoids CORS issues)
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
}