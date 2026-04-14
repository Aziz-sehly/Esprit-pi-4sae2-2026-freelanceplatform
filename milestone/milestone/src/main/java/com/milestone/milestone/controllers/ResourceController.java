package com.milestone.milestone.controllers;

import com.milestone.milestone.dto.ResourceLinkRequest;
import com.milestone.milestone.dto.ResourceResponse;
import com.milestone.milestone.models.ResourceCategory;
import com.milestone.milestone.models.ResourceEntityType;
import com.milestone.milestone.services.ResourceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/resources")
@RequiredArgsConstructor
public class ResourceController {

    private final ResourceService service;

    @PostMapping("/links")
    @ResponseStatus(HttpStatus.CREATED)
    public ResourceResponse createLink(@RequestBody @Valid ResourceLinkRequest req) {
        return service.createLink(req);
    }

    @PostMapping(value = "/files", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public ResourceResponse uploadFile(
            @RequestParam ResourceEntityType entityType,
            @RequestParam Long entityId,
            @RequestParam String label,
            @RequestParam ResourceCategory category,
            @RequestPart("file") MultipartFile file
    ) {
        return service.uploadFile(entityType, entityId, label, category.name(), file);
    }

    @GetMapping
    public List<ResourceResponse> list(
            @RequestParam ResourceEntityType entityType,
            @RequestParam Long entityId
    ) {
        return service.list(entityType, entityId);
    }

    @GetMapping("/{id}")
    public ResourceResponse getById(@PathVariable Long id) {
        return service.getById(id);
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> download(@PathVariable Long id) {
        ResourceResponse response = service.getById(id);
        Resource file = service.loadFile(id);

        return ResponseEntity.ok()
                .contentType(service.resolveMediaType(response))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + (response.fileName() == null ? "resource" : response.fileName()) + "\"")
                .body(file);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
