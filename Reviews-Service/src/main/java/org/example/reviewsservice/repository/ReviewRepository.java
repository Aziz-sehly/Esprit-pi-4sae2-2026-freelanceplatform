package org.example.reviewsservice.repository;

import org.example.reviewsservice.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
<<<<<<< HEAD
=======
import org.springframework.data.repository.query.Param;
>>>>>>> b0248089 (fonctions (pas encore integration user))
import org.springframework.stereotype.Repository;

import java.util.List;

<<<<<<< HEAD
// @Repository marks this as the "database access layer"
// It's the only place in the app that directly talks to the database
@Repository

// By extending JpaRepository<Review, Long>, we get these methods for FREE without writing any code:
//   - findAll()         → SELECT * FROM reviews
//   - findById(id)      → SELECT * FROM reviews WHERE id = ?
//   - save(review)      → INSERT or UPDATE
//   - deleteById(id)    → DELETE FROM reviews WHERE id = ?
// The first type parameter (Review) is the entity, the second (Long) is the ID type
public interface ReviewRepository extends JpaRepository<Review, Long> {

    // @Query lets us write custom SQL/JPQL queries that JpaRepository doesn't provide by default
    // This calculates the average of all rating values across all reviews
    // AVG() is a SQL function — returns null if there are no reviews
    @Query("SELECT AVG(r.rating) FROM Review r")
    Double findAverageRating();

    // This query counts how many reviews have each star rating
    // GROUP BY r.rating groups results by rating value (1, 2, 3, 4, 5)
    // Returns a list of pairs: [[1, 3], [2, 5], [4, 12], [5, 20]] meaning
    //   → 3 reviews gave 1 star, 5 gave 2 stars, 12 gave 4 stars, 20 gave 5 stars
    // Object[] means each row is an array — row[0] is the rating, row[1] is the count
    @Query("SELECT r.rating, COUNT(r) FROM Review r GROUP BY r.rating ORDER BY r.rating")
    List<Object[]> countByRating();

    // This query counts how many reviews were left for each reason
    // WHERE r.reviewReason IS NOT NULL ignores reviews that don't have a reason set
    // ORDER BY COUNT(r) DESC sorts by most popular reason first
    // Returns pairs like: [["Quality of work delivered", 12], ["Communication", 8], ...]
    @Query("SELECT r.reviewReason, COUNT(r) FROM Review r WHERE r.reviewReason IS NOT NULL GROUP BY r.reviewReason ORDER BY COUNT(r) DESC")
    List<Object[]> countByReason();
=======
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
>>>>>>> b0248089 (fonctions (pas encore integration user))
}