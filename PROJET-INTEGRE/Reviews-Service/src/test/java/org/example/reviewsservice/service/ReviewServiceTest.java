package org.example.reviewsservice.service;

import org.example.reviewsservice.entity.Review;
import org.example.reviewsservice.entity.ReviewEditHistory;
import org.example.reviewsservice.repository.ReviewEditHistoryRepository;
import org.example.reviewsservice.repository.ReviewRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReviewServiceTest {

    // Mockito creates fake versions of these — no real database is touched
    @Mock
    private ReviewRepository reviewRepository;

    @Mock
    private ReviewEditHistoryRepository editHistoryRepository;

    // Mockito injects the mocks above into this real service instance
    @InjectMocks
    private ReviewService reviewService;

    private Review sampleReview;

    @BeforeEach
    void setUp() {
        sampleReview = new Review();
        sampleReview.setId(1L);
        sampleReview.setAuthor("Alice");
        sampleReview.setContent("This platform is excellent and amazing!");
        sampleReview.setRating(5);
        sampleReview.setLanguage("en");
        sampleReview.setReviewReason("Quality of work delivered");
        sampleReview.setBookmarked(false);
        sampleReview.setHelpfulVotes(0);
    }

    // ── Test 1: getAllReviews returns what the repository returns ─────────────
    @Test
    void getAllReviews_shouldReturnAllReviews() {
        Review review2 = new Review();
        review2.setId(2L);
        review2.setAuthor("Bob");
        review2.setContent("Good service overall");
        review2.setRating(4);

        when(reviewRepository.findAll()).thenReturn(Arrays.asList(sampleReview, review2));

        List<Review> result = reviewService.getAllReviews();

        assertEquals(2, result.size());
        assertEquals("Alice", result.get(0).getAuthor());
        assertEquals("Bob", result.get(1).getAuthor());
        verify(reviewRepository, times(1)).findAll();
    }

    // ── Test 2: getReviewById returns the correct review when it exists ───────
    @Test
    void getReviewById_whenExists_shouldReturnReview() {
        when(reviewRepository.findById(1L)).thenReturn(Optional.of(sampleReview));

        Optional<Review> result = reviewService.getReviewById(1L);

        assertTrue(result.isPresent());
        assertEquals("Alice", result.get().getAuthor());
        assertEquals(5, result.get().getRating());
    }

    // ── Test 3: getReviewById returns empty when review does not exist ────────
    @Test
    void getReviewById_whenNotExists_shouldReturnEmpty() {
        when(reviewRepository.findById(99L)).thenReturn(Optional.empty());

        Optional<Review> result = reviewService.getReviewById(99L);

        assertFalse(result.isPresent());
    }

    // ── Test 4: createReview saves the review and sets sentiment automatically ─
    @Test
    void createReview_shouldSaveAndDetectPositiveSentiment() {
        // The service calls save twice (once to persist, once to update averageRating)
        when(reviewRepository.save(any(Review.class))).thenReturn(sampleReview);
        when(reviewRepository.findAverageRating()).thenReturn(4.5);

        Review result = reviewService.createReview(sampleReview);

        assertNotNull(result);
        // "excellent" and "amazing" are in POSITIVE_WORDS — sentiment should be positive
        assertEquals("positive", sampleReview.getSentiment());
        verify(reviewRepository, times(2)).save(any(Review.class));
    }

    // ── Test 5: createReview censors profanity in the content ────────────────
    @Test
    void createReview_shouldCensorProfanity() {
        sampleReview.setContent("This is a damn good platform");
        when(reviewRepository.save(any(Review.class))).thenReturn(sampleReview);
        when(reviewRepository.findAverageRating()).thenReturn(5.0);

        reviewService.createReview(sampleReview);

        // "damn" (4 chars) should be replaced with "****"
        assertFalse(sampleReview.getContent().contains("damn"));
        assertTrue(sampleReview.getContent().contains("****"));
    }

    // ── Test 6: updateReview saves a history snapshot before updating ─────────
    @Test
    void updateReview_shouldSaveHistoryAndMarkAsEdited() {
        Review updatedData = new Review();
        updatedData.setAuthor("Alice");
        updatedData.setContent("Updated content, still great service");
        updatedData.setRating(4);
        updatedData.setLanguage("en");
        updatedData.setReviewReason("Value for money");

        when(reviewRepository.findById(1L)).thenReturn(Optional.of(sampleReview));
        when(editHistoryRepository.save(any(ReviewEditHistory.class)))
                .thenReturn(new ReviewEditHistory());
        when(reviewRepository.findAverageRating()).thenReturn(4.5);
        when(reviewRepository.save(any(Review.class))).thenReturn(sampleReview);

        Review result = reviewService.updateReview(1L, updatedData);

        assertNotNull(result);
        // A history snapshot must have been saved
        verify(editHistoryRepository, times(1)).save(any(ReviewEditHistory.class));
        // The review must be marked as edited
        assertTrue(sampleReview.isEdited());
    }

    // ── Test 7: updateReview throws when review not found ────────────────────
    @Test
    void updateReview_whenNotFound_shouldThrowException() {
        when(reviewRepository.findById(99L)).thenReturn(Optional.empty());

        Review updatedData = new Review();
        updatedData.setContent("Updated content");
        updatedData.setRating(3);

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> reviewService.updateReview(99L, updatedData));

        assertTrue(ex.getMessage().contains("99"));
    }

    // ── Test 8: deleteReview calls repository deleteById ─────────────────────
    @Test
    void deleteReview_shouldCallDeleteById() {
        doNothing().when(reviewRepository).deleteById(1L);

        reviewService.deleteReview(1L);

        verify(reviewRepository, times(1)).deleteById(1L);
    }

    // ── Test 9: toggleBookmark flips the bookmarked flag ─────────────────────
    @Test
    void toggleBookmark_shouldFlipBookmarkedFlag() {
        sampleReview.setBookmarked(false);
        when(reviewRepository.findById(1L)).thenReturn(Optional.of(sampleReview));
        when(reviewRepository.save(any(Review.class))).thenReturn(sampleReview);

        reviewService.toggleBookmark(1L);

        assertTrue(sampleReview.isBookmarked());
        verify(reviewRepository, times(1)).save(sampleReview);
    }

    // ── Test 10: addHelpfulVote increments the helpful votes counter ──────────
    @Test
    void addHelpfulVote_shouldIncrementHelpfulVotes() {
        sampleReview.setHelpfulVotes(3);
        when(reviewRepository.findById(1L)).thenReturn(Optional.of(sampleReview));
        when(reviewRepository.save(any(Review.class))).thenReturn(sampleReview);

        reviewService.addHelpfulVote(1L);

        assertEquals(4, sampleReview.getHelpfulVotes());
    }

    // ── Test 11: getAverageRating returns rounded value ───────────────────────
    @Test
    void getAverageRating_shouldReturnRoundedAverage() {
        when(reviewRepository.findAverageRating()).thenReturn(4.333333);

        Double result = reviewService.getAverageRating();

        assertEquals(4.3, result);
    }

    // ── Test 12: getAverageRating returns 0 when no reviews exist ────────────
    @Test
    void getAverageRating_whenNoReviews_shouldReturnZero() {
        when(reviewRepository.findAverageRating()).thenReturn(null);

        Double result = reviewService.getAverageRating();

        assertEquals(0.0, result);
    }

    // ── Test 13: searchReviews returns all when query is blank ───────────────
    @Test
    void searchReviews_whenBlankQuery_shouldReturnAll() {
        when(reviewRepository.findAll()).thenReturn(List.of(sampleReview));

        List<Review> result = reviewService.searchReviews("   ");

        assertEquals(1, result.size());
        verify(reviewRepository, times(1)).findAll();
        verify(reviewRepository, never()).searchReviews(anyString());
    }

    // ── Test 14: searchReviews delegates to repository when query is provided ─
    @Test
    void searchReviews_withQuery_shouldDelegateToRepository() {
        when(reviewRepository.searchReviews("alice")).thenReturn(List.of(sampleReview));

        List<Review> result = reviewService.searchReviews("alice");

        assertEquals(1, result.size());
        verify(reviewRepository, times(1)).searchReviews("alice");
    }

    // ── Test 15: getReviewHistory returns history from repository ────────────
    @Test
    void getReviewHistory_shouldReturnHistoryList() {
        ReviewEditHistory h = new ReviewEditHistory();
        h.setReviewId(1L);
        h.setOldContent("old content");
        h.setNewContent("new content");

        when(editHistoryRepository.findByReviewIdOrderByEditedAtDesc(1L))
                .thenReturn(List.of(h));

        List<ReviewEditHistory> result = reviewService.getReviewHistory(1L);

        assertEquals(1, result.size());
        assertEquals("old content", result.get(0).getOldContent());
    }

    // ── Test 16: analyzeSentiment via createReview — negative content ─────────
    @Test
    void createReview_shouldDetectNegativeSentiment() {
        sampleReview.setContent("This was terrible and awful, worst experience ever");
        when(reviewRepository.save(any(Review.class))).thenReturn(sampleReview);
        when(reviewRepository.findAverageRating()).thenReturn(1.0);

        reviewService.createReview(sampleReview);

        assertEquals("negative", sampleReview.getSentiment());
    }
}