package com.prolance.message.web;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/messages")
public class FileUploadController {

    private static final Logger log = LoggerFactory.getLogger(FileUploadController.class);

    @Value("${app.upload-dir:./uploads}")
    private String uploadDir;

    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(@RequestParam(value = "file", required = false) MultipartFile file) {
        log.info("Upload received, file={}", file != null ? (file.isEmpty() ? "empty" : file.getOriginalFilename()) : "null");
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        try {
            Path dir = resolveUploadDir();
            Files.createDirectories(dir);
            String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "file";
            String ext = originalName.contains(".")
                ? originalName.substring(originalName.lastIndexOf(".")) : "";
            String filename = UUID.randomUUID() + ext;
            Path target = dir.resolve(filename);
            file.transferTo(target);
            String url = "/messages/attachments/" + filename;
            return ResponseEntity.ok(new UploadResponse(url, originalName));
        } catch (IOException e) {
            log.error("Upload failed: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body("Upload error: " + e.getMessage());
        } catch (Exception e) {
            log.error("Upload failed unexpectedly: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body("Upload error: " + e.getMessage());
        }
    }

    private Path resolveUploadDir() {
        String dir = uploadDir;
        if (dir == null || dir.isBlank() || "./uploads".equals(dir)) {
            dir = System.getProperty("java.io.tmpdir") + "/prolance-uploads";
        }
        return Paths.get(dir).toAbsolutePath().normalize();
    }

    @GetMapping("/attachments/{filename}")
    public ResponseEntity<Resource> getAttachment(@PathVariable String filename) {
        try {
            Path file = resolveUploadDir().resolve(filename);
            if (!Files.exists(file)) {
                return ResponseEntity.notFound().build();
            }
            Resource resource = new UrlResource(file.toUri());
            String contentType = Files.probeContentType(file);
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType != null ? contentType : "application/octet-stream"))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                    .body(resource);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /** Multi-file upload - returns list of {url, fileName} */
    @PostMapping("/upload-multiple")
    public ResponseEntity<?> uploadMultiple(@RequestParam("files") MultipartFile[] files) {
        if (files == null || files.length == 0) {
            return ResponseEntity.badRequest().build();
        }
        List<UploadResponse> results = new ArrayList<>();
        try {
            Path dir = resolveUploadDir();
            Files.createDirectories(dir);
            for (MultipartFile file : files) {
                if (file == null || file.isEmpty()) continue;
                String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "file";
                String ext = originalName.contains(".") ? originalName.substring(originalName.lastIndexOf(".")) : "";
                String filename = UUID.randomUUID() + ext;
                Path target = dir.resolve(filename);
                file.transferTo(target);
                results.add(new UploadResponse("/messages/attachments/" + filename, originalName));
            }
            return ResponseEntity.ok(results);
        } catch (IOException e) {
            log.error("Multi-upload failed: {}", e.getMessage());
            return ResponseEntity.status(500).body("Upload error: " + e.getMessage());
        }
    }

    public record UploadResponse(String url, String fileName) {}
}
