package org.example.reviewsservice.repository;

import org.example.reviewsservice.entity.ReviewEditHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewEditHistoryRepository extends JpaRepository<ReviewEditHistory, Long> {

    /**
     * Returns all edit history entries for a given review, ordered newest first.
     * Called by GET /api/reviews/{id}/history
     */
    List<ReviewEditHistory> findByReviewIdOrderByEditedAtDesc(Long reviewId);
}