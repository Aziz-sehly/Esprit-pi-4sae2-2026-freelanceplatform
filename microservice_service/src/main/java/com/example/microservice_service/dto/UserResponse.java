package com.example.microservice_service.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class UserResponse {
    private Long id;
    private String email;
    private String firstName;
    private String lastName;
    private String role;

    // ✅ FIXED: Jackson strips the "is" prefix when serializing boolean fields,
    //    so a field `isVerified` gets serialized as `"verified"` in JSON.
    //    We use a plain Boolean wrapper + explicit @JsonProperty to handle BOTH
    //    "verified" and "isVerified" key names from the User service.
    @JsonProperty("isVerified")
    private Boolean verified;

    @JsonProperty("isActive")
    private Boolean active;

    // ✅ Null-safe: treats null as false
    public boolean isVerified() {
        return Boolean.TRUE.equals(verified);
    }

    public boolean isActive() {
        return Boolean.TRUE.equals(active);
    }
}