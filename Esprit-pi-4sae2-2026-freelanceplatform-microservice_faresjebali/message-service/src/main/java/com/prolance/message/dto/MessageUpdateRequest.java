package com.prolance.message.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class MessageUpdateRequest {

    @NotBlank(message = "Le contenu ne peut pas être vide")
    @Size(max = 2000)
    private String content;

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }
}
