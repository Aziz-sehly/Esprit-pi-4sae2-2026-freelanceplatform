package com.prolance.message.repository;

import com.prolance.message.domain.ConversationTag;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ConversationTagRepository extends JpaRepository<ConversationTag, Long> {
    List<ConversationTag> findByContractIdAndUserIdAndOtherUserId(Long contractId, Long userId, Long otherUserId);
}
