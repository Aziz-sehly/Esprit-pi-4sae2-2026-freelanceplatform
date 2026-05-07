package com.milestone.milestone.repositories;

import com.milestone.milestone.models.Milestone;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MilestoneRepository extends JpaRepository<Milestone, Long> {
    List<Milestone> findByContractId(Long contractId);
}