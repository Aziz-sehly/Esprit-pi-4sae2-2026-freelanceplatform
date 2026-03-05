package org.example.reviewsservice.service;

import org.example.reviewsservice.entity.Review;
import org.example.reviewsservice.repository.ReviewRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

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
    private static final List<String> PROFANITY_LIST = Arrays.asList(
            "badword1", "badword2", "damn", "crap", "idiot", "stupid",
            "fuck", "shit", "ass", "bitch"
    );

    // Returns all reviews from the database as a Java List
    // The repository's findAll() generates: SELECT * FROM reviews
    public List<Review> getAllReviews() {
        return reviewRepository.findAll();
    }

    // Returns a single review by its ID, wrapped in Optional
    // Optional means: "this might return a review, or it might return nothing if the ID doesn't exist"
    // The controller uses this to return a 404 if the review is not found
    public Optional<Review> getReviewById(Long id) {
        return reviewRepository.findById(id);
    }

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
    public void deleteReview(Long id) {
        reviewRepository.deleteById(id);
    }

    // Returns just the average rating as a single number
    // Used by the GET /api/reviews/average endpoint
    public Double getAverageRating() {
        Double avg = reviewRepository.findAverageRating();
        return avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0;
    }

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
        for (Object[] row : rows) {
            int star = ((Number) row[0]).intValue();
            long count = ((Number) row[1]).longValue();
            result.put(star, count);
        }
        return result;
    }

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
        }
        return result;
    }

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
            }
            return "Translation unavailable";
        } catch (Exception e) {
            return "Translation service unavailable: " + e.getMessage();
        }
    }

    // Private helper method — censors profanity in a given text string
    // Uses a case-insensitive regex replacement: (?i) makes it ignore uppercase/lowercase
    // For example "DAMN" and "damn" are both replaced with "****"
    private String censorProfanity(String text) {
        if (text == null) return null;
        String result = text;
        for (String word : PROFANITY_LIST) {
            // "*.repeat(word.length())" creates a string of asterisks the same length as the bad word
            String censored = "*".repeat(word.length());
            result = result.replaceAll("(?i)" + word, censored);
        }
        return result;
    }
}