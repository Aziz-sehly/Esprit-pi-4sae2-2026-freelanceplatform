package com.prolance.message.repository;

import com.prolance.message.domain.UserBlock;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserBlockRepository extends JpaRepository<UserBlock, Long> {
    Optional<UserBlock> findByBlockerUserIdAndBlockedUserId(Long blockerId, Long blockedId);
    List<UserBlock> findByBlockerUserId(Long blockerUserId);
    boolean existsByBlockerUserIdAndBlockedUserId(Long blockerId, Long blockedId);
}
