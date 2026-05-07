package com.example.microservice_service.entity;

import com.example.microservice_service.entity.enums.ServiceStatus;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "services")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FreelancerService {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnoreProperties({"services", "hibernateLazyInitializer", "handler"})
    @ManyToOne(fetch = FetchType.EAGER)   // EAGER fixes shop_id null on new transient entity
    @JoinColumn(name = "shop_id", nullable = false)
    private Shop shop;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, unique = true)
    private String slug;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @Column(nullable = false)
    private String category;

    private String tags;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @JsonProperty("deliveryDays")
    @Column(name = "delivery_days", nullable = false)
    private Integer deliveryDays;

    @Column(nullable = false)
    private Integer revisionCount;

    @Column(columnDefinition = "TEXT")
    private String requirementsDescription;

    @Column(columnDefinition = "TEXT")
    private String mediaUrls;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ServiceStatus status;

    @Column(columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @JsonIgnore
    @OneToMany(mappedBy = "service", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ServiceAddOn> addOns;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) status = ServiceStatus.DRAFT;
        // Auto-generate slug from title + timestamp to guarantee uniqueness
        if (slug == null || slug.isBlank()) {
            String base = title == null ? "service" : title.toLowerCase()
                    .replaceAll("[^a-z0-9\\s-]", "")
                    .replaceAll("\\s+", "-")
                    .replaceAll("-+", "-")
                    .trim();
            if (base.isBlank()) base = "service";
            slug = base + "-" + System.currentTimeMillis();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}