package com.prolance.message.web;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;


@RestController
@RequestMapping
public class DirectUploadController {

    private final FileUploadController delegate;

    public DirectUploadController(FileUploadController delegate) {
        this.delegate = delegate;
    }

    @PostMapping(value = "/messages-upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> upload(@RequestParam(value = "file", required = false) MultipartFile file) {
        return delegate.uploadFile(file);
    }

    @PostMapping(value = "/messages-upload-multiple", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadMultiple(@RequestParam(value = "files", required = false) MultipartFile[] files) {
        return delegate.uploadMultiple(files);
    }
}
