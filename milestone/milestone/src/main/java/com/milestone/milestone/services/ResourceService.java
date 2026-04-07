package com.milestone.milestone.services;

import com.milestone.milestone.dto.ResourceLinkRequest;
import com.milestone.milestone.dto.ResourceResponse;
import com.milestone.milestone.exception.NotFoundException;
import com.milestone.milestone.models.ContractStatus;
import com.milestone.milestone.models.ResourceEntityType;
import com.milestone.milestone.models.ResourceItem;
import com.milestone.milestone.models.ResourceType;
import com.milestone.milestone.repositories.ContractRepository;
import com.milestone.milestone.repositories.MilestoneRepository;
import com.milestone.milestone.repositories.ResourceItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class ResourceService {

    private final ResourceItemRepository repo;
    private final ContractRepository contractRepository;
    private final MilestoneRepository milestoneRepository;

    @Value("${app.uploads.root:uploads}")
    private String uploadsRoot;

    public ResourceResponse createLink(ResourceLinkRequest req) {
        ensureEntityExists(req.entityType(), req.entityId());
        validateUrl(req.url());

        ResourceItem item = ResourceItem.builder()
                .entityType(req.entityType())
                .entityId(req.entityId())
                .resourceType(ResourceType.LINK)
                .category(req.category())
                .label(req.label())
                .url(req.url())
                .build();

        return toResponse(repo.save(item));
    }

    public ResourceResponse uploadFile(ResourceEntityType entityType, Long entityId, String label, String category, MultipartFile file) {
        ensureEntityExists(entityType, entityId);
        if (file == null || file.isEmpty()) {
            throw new IllegalStateException("A file is required");
        }

        try {
            Path uploadDir = buildEntityDirectory(entityType, entityId);
            Files.createDirectories(uploadDir);

            String originalName = StringUtils.cleanPath(file.getOriginalFilename() == null ? "resource" : file.getOriginalFilename());
            String storedName = UUID.randomUUID() + "-" + originalName.replace(" ", "_");
            Path target = uploadDir.resolve(storedName);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

            ResourceItem item = ResourceItem.builder()
                    .entityType(entityType)
                    .entityId(entityId)
                    .resourceType(ResourceType.FILE)
                    .category(Enum.valueOf(com.milestone.milestone.models.ResourceCategory.class, category))
                    .label(label)
                    .fileName(originalName)
                    .storagePath(target.toString())
                    .mimeType(file.getContentType())
                    .fileSize(file.getSize())
                    .build();

            return toResponse(repo.save(item));
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to store uploaded file");
        }
    }

    @Transactional(readOnly = true)
    public List<ResourceResponse> list(ResourceEntityType entityType, Long entityId) {
        ensureEntityExists(entityType, entityId);
        return repo.findByEntityTypeAndEntityIdOrderByCreatedAtDesc(entityType, entityId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public Resource loadFile(Long id) {
        ResourceItem item = findById(id);
        if (item.getResourceType() != ResourceType.FILE || item.getStoragePath() == null) {
            throw new IllegalStateException("Resource is not a file");
        }
        Resource resource = new FileSystemResource(item.getStoragePath());
        if (!resource.exists()) {
            throw new NotFoundException("Stored file not found for resource: " + id);
        }
        return resource;
    }

    @Transactional(readOnly = true)
    public ResourceResponse getById(Long id) {
        return toResponse(findById(id));
    }

    public void delete(Long id) {
        ResourceItem item = findById(id);
        if (item.getStoragePath() != null) {
            try {
                Files.deleteIfExists(Paths.get(item.getStoragePath()));
            } catch (IOException ignored) {
                // Keep metadata deletion best-effort for local demo storage.
            }
        }
        repo.delete(item);
    }

    public MediaType resolveMediaType(ResourceResponse response) {
        if (response.mimeType() == null || response.mimeType().isBlank()) {
            return MediaType.APPLICATION_OCTET_STREAM;
        }
        try {
            return MediaType.parseMediaType(response.mimeType());
        } catch (Exception ex) {
            return MediaType.APPLICATION_OCTET_STREAM;
        }
    }

    private ResourceItem findById(Long id) {
        return repo.findById(id)
                .orElseThrow(() -> new NotFoundException("Resource not found: " + id));
    }

    private void ensureEntityExists(ResourceEntityType entityType, Long entityId) {
        switch (entityType) {
            case CONTRACT -> {
                var contract = contractRepository.findById(entityId)
                        .orElseThrow(() -> new NotFoundException("Contract not found: " + entityId));
                if (contract.getStatus() == ContractStatus.CANCELLED) {
                    throw new IllegalStateException("Cannot manage resources on cancelled contracts");
                }
            }
            case MILESTONE -> milestoneRepository.findById(entityId)
                    .orElseThrow(() -> new NotFoundException("Milestone not found: " + entityId));
        }
    }

    private void validateUrl(String url) {
        try {
            URI uri = URI.create(url);
            if (uri.getScheme() == null || (!uri.getScheme().startsWith("http"))) {
                throw new IllegalStateException("Only HTTP/HTTPS URLs are allowed");
            }
        } catch (Exception ex) {
            throw new IllegalStateException("Invalid resource URL");
        }
    }

    private Path buildEntityDirectory(ResourceEntityType entityType, Long entityId) {
        return Paths.get(uploadsRoot, entityType.name().toLowerCase(), String.valueOf(entityId));
    }

    private ResourceResponse toResponse(ResourceItem item) {
        return new ResourceResponse(
                item.getId(),
                item.getEntityType(),
                item.getEntityId(),
                item.getResourceType(),
                item.getCategory(),
                item.getLabel(),
                item.getUrl(),
                item.getFileName(),
                item.getMimeType(),
                item.getFileSize(),
                item.getCreatedAt(),
                item.getResourceType() == ResourceType.FILE ? "/milestone/api/resources/" + item.getId() + "/download" : null
        );
    }
}
