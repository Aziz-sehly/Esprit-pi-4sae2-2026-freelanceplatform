package org.example.reviewsservice.service;

import org.example.reviewsservice.entity.Review;
<<<<<<< HEAD
=======
import org.example.reviewsservice.entity.ReviewEditHistory;
import org.example.reviewsservice.repository.ReviewEditHistoryRepository;
>>>>>>> b0248089 (fonctions (pas encore integration user))
import org.example.reviewsservice.repository.ReviewRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

<<<<<<< HEAD
// @Service marks this class as the "business logic layer"
// It sits between the Controller (which receives HTTP requests)
// and the Repository (which talks to the database)
// All the actual logic — filtering, calculating, transforming data — lives here
@Service
public class ReviewService {

    // @Autowired tells Spring: "automatically create and inject an instance of ReviewRepository here"
    // We never write "new ReviewRepository()" — Spring handles object creation for us
    @Autowired
    private ReviewRepository reviewRepository;

    // A hardcoded list of words that will be censored in review content
    // Any review containing these words will have them replaced with asterisks (e.g. "****")
=======
@Service
public class ReviewService {

    @Autowired
    private ReviewRepository reviewRepository;

    // NEW: injected for saving edit history snapshots
    @Autowired
    private ReviewEditHistoryRepository editHistoryRepository;

    // ── Profanity filter ──────────────────────────────────────────────
>>>>>>> b0248089 (fonctions (pas encore integration user))
    private static final List<String> PROFANITY_LIST = Arrays.asList(
            "badword1", "badword2", "damn", "crap", "idiot", "stupid",
            "fuck", "shit", "ass", "bitch"
    );

<<<<<<< HEAD
    // Returns all reviews from the database as a Java List
    // The repository's findAll() generates: SELECT * FROM reviews
=======
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

>>>>>>> b0248089 (fonctions (pas encore integration user))
    public List<Review> getAllReviews() {
        return reviewRepository.findAll();
    }

<<<<<<< HEAD
    // Returns a single review by its ID, wrapped in Optional
    // Optional means: "this might return a review, or it might return nothing if the ID doesn't exist"
    // The controller uses this to return a 404 if the review is not found
=======
>>>>>>> b0248089 (fonctions (pas encore integration user))
    public Optional<Review> getReviewById(Long id) {
        return reviewRepository.findById(id);
    }

<<<<<<< HEAD
    // Saves a new review to the database
    // Before saving, it: 1) censors bad words, 2) recalculates the global average rating
    public Review createReview(Review review) {
        // Run the review content through the profanity filter before saving
        review.setContent(censorProfanity(review.getContent()));

        // Save the review first so it's included in the average calculation
        Review saved = reviewRepository.save(review);

        // Recalculate the average rating across ALL reviews (including this new one)
        Double avg = reviewRepository.findAverageRating();

        // Math.round(avg * 10.0) / 10.0 rounds to 1 decimal place (e.g. 4.333... becomes 4.3)
        // If avg is null (no reviews yet), use this review's own rating as the average
        saved.setAverageRating(avg != null ? Math.round(avg * 10.0) / 10.0 : review.getRating());

        // Save again with the updated average rating
        return reviewRepository.save(saved);
    }

    // Updates an existing review identified by its ID
    // Uses a lambda (.map()) — if the review exists, update it; if not, throw an error
    public Review updateReview(Long id, Review updated) {
        return reviewRepository.findById(id).map(review -> {
            review.setAuthor(updated.getAuthor());
            // Censor bad words in the updated content too
            review.setContent(censorProfanity(updated.getContent()));
            review.setRating(updated.getRating());
            review.setLanguage(updated.getLanguage());
            // Update the review reason (the dropdown selection from the frontend)
            review.setReviewReason(updated.getReviewReason());
            // Recalculate average after the rating changes
            Double avg = reviewRepository.findAverageRating();
            review.setAverageRating(avg != null ? Math.round(avg * 10.0) / 10.0 : updated.getRating());
            return reviewRepository.save(review);
            // If no review found with this ID, throw an exception — the controller will return 404
        }).orElseThrow(() -> new RuntimeException("Review not found with id: " + id));
    }

    // Deletes a review by ID from the database
=======
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

>>>>>>> b0248089 (fonctions (pas encore integration user))
    public void deleteReview(Long id) {
        reviewRepository.deleteById(id);
    }

<<<<<<< HEAD
    // Returns just the average rating as a single number
    // Used by the GET /api/reviews/average endpoint
=======
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
>>>>>>> b0248089 (fonctions (pas encore integration user))
    public Double getAverageRating() {
        Double avg = reviewRepository.findAverageRating();
        return avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0;
    }

<<<<<<< HEAD
    // Builds a map showing how many reviews have each star rating (1 through 5)
    // Example result: {1=2, 2=0, 3=5, 4=10, 5=18}
    // Used to draw the bar chart in the back office Statistics tab
    public Map<Integer, Long> getRatingDistribution() {
        List<Object[]> rows = reviewRepository.countByRating();

        // LinkedHashMap preserves insertion order (so stars go 1, 2, 3, 4, 5 in order)
        Map<Integer, Long> result = new LinkedHashMap<>();

        // Initialize all 5 star ratings to 0 — so even if no reviews have 2 stars,
        // the map still contains {2: 0} instead of missing the key entirely
        for (int i = 1; i <= 5; i++) result.put(i, 0L);

        // Fill in the actual counts from the database query
        // row[0] is the star rating (e.g. 4), row[1] is the count (e.g. 10)
=======
    // ── Statistics ────────────────────────────────────────────────────
    public Map<Integer, Long> getRatingDistribution() {
        List<Object[]> rows = reviewRepository.countByRating();
        Map<Integer, Long> result = new LinkedHashMap<>();
        for (int i = 1; i <= 5; i++) result.put(i, 0L);
>>>>>>> b0248089 (fonctions (pas encore integration user))
        for (Object[] row : rows) {
            int star = ((Number) row[0]).intValue();
            long count = ((Number) row[1]).longValue();
            result.put(star, count);
        }
        return result;
    }

<<<<<<< HEAD
    // Builds a map showing how many reviews were left for each reason
    // Example result: {"Quality of work delivered": 12, "Communication": 8, ...}
    // Used to draw the reason distribution chart in the back office Statistics tab
    public Map<String, Long> getReasonDistribution() {
        List<Object[]> rows = reviewRepository.countByReason();
        Map<String, Long> result = new LinkedHashMap<>();
        // row[0] is the reason string, row[1] is the count
        for (Object[] row : rows) {
            String reason = (String) row[0];
            long count = ((Number) row[1]).longValue();
            result.put(reason, count);
=======
    public Map<String, Long> getReasonDistribution() {
        List<Object[]> rows = reviewRepository.countByReason();
        Map<String, Long> result = new LinkedHashMap<>();
        for (Object[] row : rows) {
            result.put((String) row[0], ((Number) row[1]).longValue());
>>>>>>> b0248089 (fonctions (pas encore integration user))
        }
        return result;
    }

<<<<<<< HEAD
    // Calls the free MyMemory translation API to translate review content
    // sourceLang and targetLang are language codes like "en", "fr", "ar"
    // This is called from the controller when a user clicks "Translate" on a review
    public String translateText(String text, String sourceLang, String targetLang) {
        try {
            // RestTemplate is Spring's built-in HTTP client — used to call external APIs
            RestTemplate restTemplate = new RestTemplate();

            // URL-encode the text so special characters (spaces, accents) don't break the URL
            String encodedText = java.net.URLEncoder.encode(text, "UTF-8");

            // MyMemory expects a language pair in format "en|fr"
            String langPair = sourceLang + "|" + targetLang;
            String url = "https://api.mymemory.translated.net/get?q=" + encodedText + "&langpair=" + langPair;

            // Make the HTTP GET request and parse the JSON response into a Map
            Map response = restTemplate.getForObject(url, Map.class);

            // Dig into the response JSON to extract the translated text
            if (response != null && response.containsKey("responseData")) {
                Map responseData = (Map) response.get("responseData");
                String translated = (String) responseData.get("translatedText");
                if (translated != null && !translated.isBlank()) {
                    return translated;
                }
=======
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
>>>>>>> b0248089 (fonctions (pas encore integration user))
            }
            return "Translation unavailable";
        } catch (Exception e) {
            return "Translation service unavailable: " + e.getMessage();
        }
    }

<<<<<<< HEAD
    // Private helper method — censors profanity in a given text string
    // Uses a case-insensitive regex replacement: (?i) makes it ignore uppercase/lowercase
    // For example "DAMN" and "damn" are both replaced with "****"
=======
    // ── Private helpers ───────────────────────────────────────────────
>>>>>>> b0248089 (fonctions (pas encore integration user))
    private String censorProfanity(String text) {
        if (text == null) return null;
        String result = text;
        for (String word : PROFANITY_LIST) {
<<<<<<< HEAD
            // "*.repeat(word.length())" creates a string of asterisks the same length as the bad word
            String censored = "*".repeat(word.length());
            result = result.replaceAll("(?i)" + word, censored);
        }
        return result;
    }
=======
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
>>>>>>> b0248089 (fonctions (pas encore integration user))
}