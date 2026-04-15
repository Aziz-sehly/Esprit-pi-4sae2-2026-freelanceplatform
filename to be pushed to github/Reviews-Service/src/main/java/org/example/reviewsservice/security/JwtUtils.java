package org.example.reviewsservice.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;

@Component
public class JwtUtils {

    @Value("${jwt.secret}")
    private String secretKey;

    /**
     * Extracts the userId claim from a raw JWT string (no "Bearer " prefix).
     */
    public Long extractUserId(String token) {
        Claims claims = extractAllClaims(token);
        Number userId = (Number) claims.get("userId");
        if (userId == null) {
            throw new RuntimeException("JWT does not contain a userId claim");
        }
        return userId.longValue();
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSignInKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private Key getSignInKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}