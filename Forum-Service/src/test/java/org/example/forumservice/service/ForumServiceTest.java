package org.example.forumservice.service;

import org.example.forumservice.entity.ForumPost;
import org.example.forumservice.entity.PostEditHistory;
import org.example.forumservice.entity.Reply;
import org.example.forumservice.repository.ForumPostRepository;
import org.example.forumservice.repository.PostEditHistoryRepository;
import org.example.forumservice.repository.ReplyRepository;
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
class ForumServiceTest {

    @Mock
    private ForumPostRepository postRepository;

    @Mock
    private ReplyRepository replyRepository;

    @Mock
    private PostEditHistoryRepository editHistoryRepository;

    @InjectMocks
    private ForumService forumService;

    private ForumPost samplePost;
    private Reply sampleReply;

    @BeforeEach
    void setUp() {
        samplePost = new ForumPost();
        samplePost.setId(1L);
        samplePost.setAuthor("Ahmed");
        samplePost.setTitle("How to get clients as a freelancer?");
        samplePost.setContent("I am new to freelancing and looking for advice on finding clients.");
        samplePost.setReactions("{}");
        samplePost.setBookmarked(false);
        samplePost.setEdited(false);

        sampleReply = new Reply();
        sampleReply.setId(10L);
        sampleReply.setAuthor("Sara");
        sampleReply.setContent("Start with your network and build a portfolio!");
        sampleReply.setLikeCount(0);
        sampleReply.setPost(samplePost);
    }

    // ── Test 1: getAllPosts returns all posts from repository ─────────────────
    @Test
    void getAllPosts_shouldReturnAllPosts() {
        ForumPost post2 = new ForumPost();
        post2.setId(2L);
        post2.setAuthor("Mehdi");
        post2.setTitle("Best tools for remote work?");

        when(postRepository.findAll()).thenReturn(Arrays.asList(samplePost, post2));

        List<ForumPost> result = forumService.getAllPosts();

        assertEquals(2, result.size());
        assertEquals("Ahmed", result.get(0).getAuthor());
        assertEquals("Mehdi", result.get(1).getAuthor());
        verify(postRepository, times(1)).findAll();
    }

    // ── Test 2: getPostById returns the post when it exists ──────────────────
    @Test
    void getPostById_whenExists_shouldReturnPost() {
        when(postRepository.findById(1L)).thenReturn(Optional.of(samplePost));

        Optional<ForumPost> result = forumService.getPostById(1L);

        assertTrue(result.isPresent());
        assertEquals("Ahmed", result.get().getAuthor());
        assertEquals("How to get clients as a freelancer?", result.get().getTitle());
    }

    // ── Test 3: getPostById returns empty when post does not exist ────────────
    @Test
    void getPostById_whenNotExists_shouldReturnEmpty() {
        when(postRepository.findById(99L)).thenReturn(Optional.empty());

        Optional<ForumPost> result = forumService.getPostById(99L);

        assertFalse(result.isPresent());
    }

    // ── Test 4: createPost saves the post and returns it ─────────────────────
    @Test
    void createPost_shouldSaveAndReturnPost() {
        when(postRepository.save(any(ForumPost.class))).thenReturn(samplePost);

        ForumPost result = forumService.createPost(samplePost);

        assertNotNull(result);
        assertEquals("Ahmed", result.getAuthor());
        verify(postRepository, times(1)).save(samplePost);
    }

    // ── Test 5: updatePost saves a history snapshot and marks post as edited ──
    @Test
    void updatePost_shouldSaveHistoryAndMarkAsEdited() {
        ForumPost updatedData = new ForumPost();
        updatedData.setAuthor("Ahmed");
        updatedData.setTitle("How to get clients as a freelancer? (Updated)");
        updatedData.setContent("Updated content with more detailed advice about freelancing.");

        when(postRepository.findById(1L)).thenReturn(Optional.of(samplePost));
        when(editHistoryRepository.save(any(PostEditHistory.class)))
                .thenReturn(new PostEditHistory());
        when(postRepository.save(any(ForumPost.class))).thenReturn(samplePost);

        ForumPost result = forumService.updatePost(1L, updatedData);

        assertNotNull(result);
        // A history snapshot must have been saved before the update
        verify(editHistoryRepository, times(1)).save(any(PostEditHistory.class));
        // The post must be flagged as edited
        assertTrue(samplePost.isEdited());
        assertEquals("How to get clients as a freelancer? (Updated)", samplePost.getTitle());
    }

    // ── Test 6: updatePost throws when post not found ─────────────────────────
    @Test
    void updatePost_whenNotFound_shouldThrowException() {
        when(postRepository.findById(99L)).thenReturn(Optional.empty());

        ForumPost updatedData = new ForumPost();
        updatedData.setTitle("Updated title");
        updatedData.setContent("Updated content");

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> forumService.updatePost(99L, updatedData));

        assertTrue(ex.getMessage().contains("99"));
    }

    // ── Test 7: deletePost calls repository deleteById ────────────────────────
    @Test
    void deletePost_shouldCallDeleteById() {
        doNothing().when(postRepository).deleteById(1L);

        forumService.deletePost(1L);

        verify(postRepository, times(1)).deleteById(1L);
    }

    // ── Test 8: toggleBookmark flips the bookmarked flag ─────────────────────
    @Test
    void toggleBookmark_shouldFlipBookmarkedFlag() {
        samplePost.setBookmarked(false);
        when(postRepository.findById(1L)).thenReturn(Optional.of(samplePost));
        when(postRepository.save(any(ForumPost.class))).thenReturn(samplePost);

        forumService.toggleBookmark(1L);

        assertTrue(samplePost.isBookmarked());
        verify(postRepository, times(1)).save(samplePost);
    }

    // ── Test 9: toggleBookmark can also un-bookmark a post ───────────────────
    @Test
    void toggleBookmark_whenAlreadyBookmarked_shouldRemoveBookmark() {
        samplePost.setBookmarked(true);
        when(postRepository.findById(1L)).thenReturn(Optional.of(samplePost));
        when(postRepository.save(any(ForumPost.class))).thenReturn(samplePost);

        forumService.toggleBookmark(1L);

        assertFalse(samplePost.isBookmarked());
    }

    // ── Test 10: addReply links the reply to the post and saves it ───────────
    @Test
    void addReply_shouldLinkReplyToPostAndSave() {
        Reply newReply = new Reply();
        newReply.setAuthor("Sara");
        newReply.setContent("Great question! Here is my advice...");

        when(postRepository.findById(1L)).thenReturn(Optional.of(samplePost));
        when(replyRepository.save(any(Reply.class))).thenReturn(newReply);

        Reply result = forumService.addReply(1L, newReply);

        assertNotNull(result);
        // The reply's post reference must be set to samplePost
        assertEquals(samplePost, newReply.getPost());
        verify(replyRepository, times(1)).save(newReply);
    }

    // ── Test 11: getRepliesByPost returns all replies for a post ─────────────
    @Test
    void getRepliesByPost_shouldReturnReplies() {
        when(replyRepository.findByPostId(1L)).thenReturn(List.of(sampleReply));

        List<Reply> result = forumService.getRepliesByPost(1L);

        assertEquals(1, result.size());
        assertEquals("Sara", result.get(0).getAuthor());
        verify(replyRepository, times(1)).findByPostId(1L);
    }

    // ── Test 12: likeReply increments the like count ─────────────────────────
    @Test
    void likeReply_shouldIncrementLikeCount() {
        sampleReply.setLikeCount(2);
        when(replyRepository.findById(10L)).thenReturn(Optional.of(sampleReply));
        when(replyRepository.save(any(Reply.class))).thenReturn(sampleReply);

        Reply result = forumService.likeReply(10L);

        assertEquals(3, sampleReply.getLikeCount());
        verify(replyRepository, times(1)).save(sampleReply);
    }

    // ── Test 13: searchPosts with blank query returns all posts ───────────────
    @Test
    void searchPosts_whenBlankQuery_shouldReturnAll() {
        when(postRepository.findAll()).thenReturn(List.of(samplePost));

        List<ForumPost> result = forumService.searchPosts("  ");

        assertEquals(1, result.size());
        verify(postRepository, times(1)).findAll();
        verify(postRepository, never()).searchPosts(anyString());
    }

    // ── Test 14: searchPosts delegates to repository when query is provided ───
    @Test
    void searchPosts_withQuery_shouldDelegateToRepository() {
        when(postRepository.searchPosts("freelancer"))
                .thenReturn(List.of(samplePost));

        List<ForumPost> result = forumService.searchPosts("freelancer");

        assertEquals(1, result.size());
        assertEquals("Ahmed", result.get(0).getAuthor());
        verify(postRepository, times(1)).searchPosts("freelancer");
    }

    // ── Test 15: getPostHistory returns snapshots from repository ────────────
    @Test
    void getPostHistory_shouldReturnHistoryList() {
        PostEditHistory h = new PostEditHistory();
        h.setPostId(1L);
        h.setOldTitle("Old title");
        h.setNewTitle("New title");
        h.setOldContent("Old content");
        h.setNewContent("New content");

        when(editHistoryRepository.findByPostIdOrderByEditedAtDesc(1L))
                .thenReturn(List.of(h));

        List<PostEditHistory> result = forumService.getPostHistory(1L);

        assertEquals(1, result.size());
        assertEquals("Old title", result.get(0).getOldTitle());
        assertEquals("New title", result.get(0).getNewTitle());
    }

    // ── Test 16: addReaction updates the reactions JSON on the post ───────────
    @Test
    void addReaction_shouldIncrementEmojiCount() throws Exception {
        samplePost.setReactions("{\"👍\":2}");
        when(postRepository.findById(1L)).thenReturn(Optional.of(samplePost));
        when(postRepository.save(any(ForumPost.class))).thenReturn(samplePost);

        ForumPost result = forumService.addReaction(1L, "👍");

        // The reactions JSON should now show 3 for the 👍 emoji
        assertNotNull(result);
        assertTrue(samplePost.getReactions().contains("3"));
    }

    // ── Test 17: convertToEmbedUrl via createPostWithImage — YouTube URL ──────
    @Test
    void createPost_withYoutubeUrl_shouldConvertToEmbedUrl() throws Exception {
        // We test the embed URL conversion indirectly through createPostWithImage
        // by passing a standard YouTube watch URL and checking the stored value
        String youtubeWatchUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

        when(postRepository.save(any(ForumPost.class))).thenAnswer(inv -> inv.getArgument(0));

        ForumPost result = forumService.createPostWithImage(
                "Ahmed", "Test post", "Test content",
                null, null, youtubeWatchUrl
        );

        assertEquals("https://www.youtube.com/embed/dQw4w9WgXcQ", result.getVideoUrl());
    }
}