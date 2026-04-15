package org.example.reviewsservice.repository;

import org.example.reviewsservice.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    // Calculates the average star rating across all reviews.
    // Returns null if there are no reviews yet.
    @Query("SELECT AVG(r.rating) FROM Review r")
    Double findAverageRating();

    // Counts how many reviews have each star rating (1–5).
    // Returns rows like: [[1, 3], [4, 12], [5, 20]] (rating, count pairs).
    @Query("SELECT r.rating, COUNT(r) FROM Review r GROUP BY r.rating ORDER BY r.rating")
    List<Object[]> countByRating();

    // Counts how many reviews were left for each reason.
    // Skips reviews with no reason set. Sorted by most popular reason first.
    @Query("SELECT r.reviewReason, COUNT(r) FROM Review r WHERE r.reviewReason IS NOT NULL GROUP BY r.reviewReason ORDER BY COUNT(r) DESC")
    List<Object[]> countByReason();

    // ── NEW: Search ───────────────────────────────────────────────────
    // Returns reviews whose content, author, or reviewReason contains the query.
    // LOWER() on both sides makes it case-insensitive.
    // Called by ReviewService.searchReviews() → GET /api/reviews/search?q=...
    @Query("SELECT r FROM Review r WHERE " +
            "LOWER(r.content) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
            "LOWER(r.author) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
            "LOWER(r.reviewReason) LIKE LOWER(CONCAT('%', :q, '%'))")
    List<Review> searchReviews(@Param("q") String query);

    // ── NEW: Sentiment distribution ───────────────────────────────────
    // Counts how many reviews have each sentiment value (positive/neutral/negative).
    // Used by GET /api/reviews/stats to power the sentiment chart in the back office.
    // WHERE r.sentiment IS NOT NULL skips reviews created before the sentiment feature
    // was added (they would have null sentiment until re-saved).
    @Query("SELECT r.sentiment, COUNT(r) FROM Review r WHERE r.sentiment IS NOT NULL GROUP BY r.sentiment")
    List<Object[]> countBySentiment();
}