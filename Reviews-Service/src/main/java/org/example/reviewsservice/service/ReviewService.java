package org.example.reviewsservice.service;

import org.example.reviewsservice.entity.Review;
import org.example.reviewsservice.entity.ReviewEditHistory;
import org.example.reviewsservice.repository.ReviewEditHistoryRepository;
import org.example.reviewsservice.repository.ReviewRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class ReviewService {

    @Autowired
    private ReviewRepository reviewRepository;

    // NEW: injected for saving edit history snapshots
    @Autowired
    private ReviewEditHistoryRepository editHistoryRepository;

    // ── Profanity filter ──────────────────────────────────────────────
    private static final List<String> PROFANITY_LIST = Arrays.asList(
            "badword1", "badword2", "damn", "crap", "idiot", "stupid",
            "fuck", "shit", "ass", "bitch"
    );

    // ── Sentiment keyword lists ───────────────────────────────────────
    private static final List<String> POSITIVE_WORDS = Arrays.asList(
            "excellent", "amazing", "great", "good", "fantastic", "wonderful",
            "outstanding", "perfect", "love", "best", "awesome", "brilliant",
            "superb", "happy", "pleased", "satisfied", "recommend", "professional",
            "quality", "fast", "efficient", "helpful", "reliable", "impressive",
            "exceptional", "delighted", "thorough", "friendly", "responsive"
    );

    private static final List<String> NEGATIVE_WORDS = Arrays.asList(
            "terrible", "awful", "bad", "worst", "horrible", "poor", "disappointing",
            "useless", "slow", "rude", "unprofessional", "waste", "broken", "failed",
            "frustrating", "annoying", "hate", "never", "wrong", "mistake",
            "unresponsive", "late", "incomplete", "buggy", "overpriced"
    );

    // ── Basic CRUD ────────────────────────────────────────────────────

    public List<Review> getAllReviews() {
        return reviewRepository.findAll();
    }

    public Optional<Review> getReviewById(Long id) {
        return reviewRepository.findById(id);
    }

    public Review createReview(Review review) {
        review.setContent(censorProfanity(review.getContent()));
        review.setSentiment(analyzeSentiment(review.getContent()));

        Review saved = reviewRepository.save(review);

        Double avg = reviewRepository.findAverageRating();
        saved.setAverageRating(avg != null ? Math.round(avg * 10.0) / 10.0 : review.getRating());

        return reviewRepository.save(saved);
    }

    /**
     * Updates an existing review.
     * SAVES A HISTORY SNAPSHOT before applying changes so that
     * GET /api/reviews/{id}/history can show the full edit timeline.
     * Also marks the review as edited so the frontend shows the "edited" badge.
     */
    public Review updateReview(Long id, Review updated) {
        return reviewRepository.findById(id).map(review -> {

            // ── NEW: Save history snapshot BEFORE applying changes ────
            ReviewEditHistory history = new ReviewEditHistory();
            history.setReviewId(id);
            history.setOldContent(review.getContent());
            history.setNewContent(updated.getContent());
            history.setOldRating(review.getRating());
            history.setNewRating(updated.getRating());
            history.setEditedBy(updated.getAuthor());
            editHistoryRepository.save(history);

            // Apply new values
            review.setAuthor(updated.getAuthor());
            review.setContent(censorProfanity(updated.getContent()));
            review.setRating(updated.getRating());
            review.setLanguage(updated.getLanguage());
            review.setReviewReason(updated.getReviewReason());
            review.setSentiment(analyzeSentiment(review.getContent()));
            review.setEdited(true); // NEW: mark as edited

            Double avg = reviewRepository.findAverageRating();
            review.setAverageRating(avg != null ? Math.round(avg * 10.0) / 10.0 : updated.getRating());
            return reviewRepository.save(review);
        }).orElseThrow(() -> new RuntimeException("Review not found with id: " + id));
    }

    public void deleteReview(Long id) {
        reviewRepository.deleteById(id);
    }

    // ── NEW: Edit history ─────────────────────────────────────────────
    // Returns all edit snapshots for a review, newest first.
    // Called by GET /api/reviews/{id}/history
    public List<ReviewEditHistory> getReviewHistory(Long reviewId) {
        return editHistoryRepository.findByReviewIdOrderByEditedAtDesc(reviewId);
    }

    // ── Bookmark toggle ───────────────────────────────────────────────
    public Review toggleBookmark(Long id) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Review not found with id: " + id));
        review.setBookmarked(!review.isBookmarked());
        return reviewRepository.save(review);
    }

    // ── Helpful vote ──────────────────────────────────────────────────
    public Review addHelpfulVote(Long id) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Review not found with id: " + id));
        review.setHelpfulVotes(review.getHelpfulVotes() + 1);
        return reviewRepository.save(review);
    }

    // ── Search ────────────────────────────────────────────────────────
    public List<Review> searchReviews(String query) {
        if (query == null || query.isBlank()) return reviewRepository.findAll();
        return reviewRepository.searchReviews(query.trim());
    }

    // ── Average rating ────────────────────────────────────────────────
    public Double getAverageRating() {
        Double avg = reviewRepository.findAverageRating();
        return avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0;
    }

    // ── Statistics ────────────────────────────────────────────────────
    public Map<Integer, Long> getRatingDistribution() {
        List<Object[]> rows = reviewRepository.countByRating();
        Map<Integer, Long> result = new LinkedHashMap<>();
        for (int i = 1; i <= 5; i++) result.put(i, 0L);
        for (Object[] row : rows) {
            int star = ((Number) row[0]).intValue();
            long count = ((Number) row[1]).longValue();
            result.put(star, count);
        }
        return result;
    }

    public Map<String, Long> getReasonDistribution() {
        List<Object[]> rows = reviewRepository.countByReason();
        Map<String, Long> result = new LinkedHashMap<>();
        for (Object[] row : rows) {
            result.put((String) row[0], ((Number) row[1]).longValue());
        }
        return result;
    }

    public Map<String, Long> getSentimentDistribution() {
        List<Object[]> rows = reviewRepository.countBySentiment();
        Map<String, Long> result = new LinkedHashMap<>();
        result.put("positive", 0L);
        result.put("neutral",  0L);
        result.put("negative", 0L);
        for (Object[] row : rows) {
            String sentiment = (String) row[0];
            long count = ((Number) row[1]).longValue();
            result.put(sentiment, count);
        }
        return result;
    }

    // ── Translation ───────────────────────────────────────────────────
    public String translateText(String text, String sourceLang, String targetLang) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            String encodedText = java.net.URLEncoder.encode(text, "UTF-8");
            String langPair = sourceLang + "|" + targetLang;
            String url = "https://api.mymemory.translated.net/get?q=" + encodedText + "&langpair=" + langPair;
            Map response = restTemplate.getForObject(url, Map.class);
            if (response != null && response.containsKey("responseData")) {
                Map responseData = (Map) response.get("responseData");
                String translated = (String) responseData.get("translatedText");
                if (translated != null && !translated.isBlank()) return translated;
            }
            return "Translation unavailable";
        } catch (Exception e) {
            return "Translation service unavailable: " + e.getMessage();
        }
    }

    // ── Private helpers ───────────────────────────────────────────────
    private String censorProfanity(String text) {
        if (text == null) return null;
        String result = text;
        for (String word : PROFANITY_LIST) {
            result = result.replaceAll("(?i)" + word, "*".repeat(word.length()));
        }
        return result;
    }

    private String analyzeSentiment(String text) {
        if (text == null || text.isBlank()) return "neutral";
        String lower = text.toLowerCase();
        long positiveScore = POSITIVE_WORDS.stream().filter(lower::contains).count();
        long negativeScore = NEGATIVE_WORDS.stream().filter(lower::contains).count();
        if (positiveScore > negativeScore) return "positive";
        if (negativeScore > positiveScore) return "negative";
        return "neutral";
    }
}