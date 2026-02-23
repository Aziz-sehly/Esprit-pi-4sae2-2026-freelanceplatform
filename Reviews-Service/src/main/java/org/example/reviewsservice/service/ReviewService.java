package org.example.reviewsservice.service;

import org.example.reviewsservice.entity.Review;
import org.example.reviewsservice.repository.ReviewRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class ReviewService {

    @Autowired
    private ReviewRepository reviewRepository;

    // Basic profanity word list - extend as needed
    private static final List<String> PROFANITY_LIST = Arrays.asList(
            "badword1", "badword2", "damn", "crap", "idiot", "stupid",
            "fuck", "shit", "ass", "bitch"
    );

    public List<Review> getAllReviews() {
        return reviewRepository.findAll();
    }

    public Optional<Review> getReviewById(Long id) {
        return reviewRepository.findById(id);
    }

    public Review createReview(Review review) {
        // Apply profanity filter
        review.setContent(censorProfanity(review.getContent()));

        // Calculate and update average rating
        Review saved = reviewRepository.save(review);
        Double avg = reviewRepository.findAverageRating();
        saved.setAverageRating(avg != null ? Math.round(avg * 10.0) / 10.0 : review.getRating());
        return reviewRepository.save(saved);
    }

    public Review updateReview(Long id, Review updated) {
        return reviewRepository.findById(id).map(review -> {
            review.setAuthor(updated.getAuthor());
            review.setContent(censorProfanity(updated.getContent()));
            review.setRating(updated.getRating());
            review.setLanguage(updated.getLanguage());
            Double avg = reviewRepository.findAverageRating();
            review.setAverageRating(avg != null ? Math.round(avg * 10.0) / 10.0 : updated.getRating());
            return reviewRepository.save(review);
        }).orElseThrow(() -> new RuntimeException("Review not found with id: " + id));
    }

    public void deleteReview(Long id) {
        reviewRepository.deleteById(id);
    }

    public Double getAverageRating() {
        Double avg = reviewRepository.findAverageRating();
        return avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0;
    }

    public String translateText(String text, String sourceLang, String targetLang) {
        try {
            RestTemplate restTemplate = new RestTemplate();

            // MyMemory free API — no key required, uses review's stored language as source
            String encodedText = java.net.URLEncoder.encode(text, "UTF-8");
            String langPair = sourceLang + "|" + targetLang;
            String url = "https://api.mymemory.translated.net/get?q=" + encodedText + "&langpair=" + langPair;

            Map response = restTemplate.getForObject(url, Map.class);

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

    private String censorProfanity(String text) {
        if (text == null) return null;
        String result = text;
        for (String word : PROFANITY_LIST) {
            String censored = "*".repeat(word.length());
            result = result.replaceAll("(?i)" + word, censored);
        }
        return result;
    }
}