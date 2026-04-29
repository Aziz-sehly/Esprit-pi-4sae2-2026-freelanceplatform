package org.example.forumservice.repository;

import org.example.forumservice.entity.PostEditHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostEditHistoryRepository extends JpaRepository<PostEditHistory, Long> {

    /**
     * Returns all edit history entries for a given post, ordered newest first.
     * Called by GET /api/posts/{id}/history
     */
    List<PostEditHistory> findByPostIdOrderByEditedAtDesc(Long postId);
}