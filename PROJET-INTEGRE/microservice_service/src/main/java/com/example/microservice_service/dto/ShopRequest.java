package com.example.microservice_service.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/**
 * DTO for creating/updating a Shop.
 * Accepts both "shopName" and "name" from JSON so frontend flexibility is preserved.
 * Accepts both "avatarUrl" and "logoUrl" for the same reason.
 */
@Data
public class ShopRequest {

    // Accept "shopName" OR "name" from JSON body
    @JsonProperty("shopName")
    private String shopName;

    @JsonProperty("name")
    private void setNameAlias(String name) {
        if (this.shopName == null) this.shopName = name;
    }

    private String tagline;
    private String description;

    // Accept "avatarUrl" OR "logoUrl" from JSON body
    @JsonProperty("avatarUrl")
    private String avatarUrl;

    @JsonProperty("logoUrl")
    private void setLogoUrlAlias(String logoUrl) {
        if (this.avatarUrl == null) this.avatarUrl = logoUrl;
    }

    private String bannerUrl;
}