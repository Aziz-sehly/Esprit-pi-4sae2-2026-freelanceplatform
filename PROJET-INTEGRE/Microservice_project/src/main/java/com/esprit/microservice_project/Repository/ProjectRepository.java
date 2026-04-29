package com.esprit.microservice_project.Repository;

import com.esprit.microservice_project.Entity.Experience;
import com.esprit.microservice_project.Entity.Project;
import com.esprit.microservice_project.Entity.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProjectRepository extends JpaRepository<Project, Integer> {

    // ✅ clientId is now a plain Long field, no more client_id navigation
    List<Project> findByClientId(Long clientId);

    @Query("""
    SELECT p FROM Project p
    WHERE (:query IS NULL OR LOWER(p.title)       LIKE LOWER(CONCAT('%',:query,'%'))
                          OR LOWER(p.description)  LIKE LOWER(CONCAT('%',:query,'%'))
                          OR LOWER(p.category)     LIKE LOWER(CONCAT('%',:query,'%'))
                          OR LOWER(p.skills)       LIKE LOWER(CONCAT('%',:query,'%')))
      AND (:category   IS NULL OR p.category        = :category)
      AND (:status     IS NULL OR p.status          = :status)
      AND (:experience IS NULL OR p.experienceLevel = :experience)
      AND (:budgetMin  IS NULL OR p.budget_max      >= :budgetMin)
      AND (:budgetMax  IS NULL OR p.budget_min      <= :budgetMax)
    ORDER BY p.id DESC
    """)
    List<Project> search(
            @Param("query")      String     query,
            @Param("category")   String     category,
            @Param("status")     Status     status,
            @Param("experience") Experience experience,
            @Param("budgetMin")  Float      budgetMin,
            @Param("budgetMax")  Float      budgetMax
    );

    @Query("""
    SELECT p FROM Project p
    WHERE (:category   IS NULL OR p.category        = :category)
      AND (:status     IS NULL OR p.status          = :status)
      AND (:experience IS NULL OR p.experienceLevel = :experience)
      AND (:budgetMin  IS NULL OR p.budget_max      >= :budgetMin)
      AND (:budgetMax  IS NULL OR p.budget_min      <= :budgetMax)
    ORDER BY p.id DESC
    """)
    List<Project> filter(
            @Param("category")   String     category,
            @Param("status")     Status     status,
            @Param("experience") Experience experience,
            @Param("budgetMin")  Float      budgetMin,
            @Param("budgetMax")  Float      budgetMax
    );
}