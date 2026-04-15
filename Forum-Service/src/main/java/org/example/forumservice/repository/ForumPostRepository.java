package org.example.forumservice.repository;

import org.example.forumservice.entity.ForumPost;
import org.springframework.data.jpa.repository.JpaRepository;
<<<<<<< HEAD
import org.springframework.stereotype.Repository;

@Repository
public interface ForumPostRepository extends JpaRepository<ForumPost, Long> {
=======
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ForumPostRepository extends JpaRepository<ForumPost, Long> {

    // ── NEW: Full-text search ─────────────────────────────────────────
    // Searches posts where the query string appears in title, content, OR author.
    // LOWER() on both sides makes the search case-insensitive.
    // %:q% means "contains q anywhere" (SQL LIKE wildcard on both sides).
    // Called by ForumService.searchPosts() → GET /api/posts/search?q=...
    @Query("SELECT p FROM ForumPost p WHERE " +
            "LOWER(p.title) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
            "LOWER(p.content) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
            "LOWER(p.author) LIKE LOWER(CONCAT('%', :q, '%'))")
    List<ForumPost> searchPosts(@Param("q") String query);
>>>>>>> b0248089 (fonctions (pas encore integration user))
}