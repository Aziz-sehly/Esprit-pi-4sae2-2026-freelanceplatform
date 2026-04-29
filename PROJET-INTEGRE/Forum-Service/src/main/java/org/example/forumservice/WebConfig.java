package org.example.forumservice;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

// @Configuration tells Spring: "this class contains configuration settings"
// Spring will read this class at startup and apply its settings
@Configuration
public class WebConfig implements WebMvcConfigurer {

    // This method tells Spring how to serve uploaded files over HTTP
    // Without this, uploaded images and audio files would not be accessible via URL
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {

        // Convert the relative "uploads" path to an absolute file system path
        // e.g. "C:/Users/Hamza/IdeaProjects/Forum-Service/uploads/"
        String uploadPath = Paths.get("uploads").toAbsolutePath().toUri().toString();

        // Map any URL starting with /uploads/ to the actual uploads folder on disk
        // So when the frontend requests: GET http://localhost:8082/uploads/abc123_audio.mp3
        // Spring looks for the file at: C:/Users/.../Forum-Service/uploads/abc123_audio.mp3
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(uploadPath);
    }
}