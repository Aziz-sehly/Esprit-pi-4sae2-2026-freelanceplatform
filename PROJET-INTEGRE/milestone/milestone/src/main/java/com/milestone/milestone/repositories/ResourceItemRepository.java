package com.milestone.milestone.repositories;

import com.milestone.milestone.models.ResourceEntityType;
import com.milestone.milestone.models.ResourceItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ResourceItemRepository extends JpaRepository<ResourceItem, Long> {
    List<ResourceItem> findByEntityTypeAndEntityIdOrderByCreatedAtDesc(ResourceEntityType entityType, Long entityId);
}
