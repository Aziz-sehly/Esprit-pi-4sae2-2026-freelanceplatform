package com.prolance.message.dto;

public class UserDto {

    private Long id;
    private String username;
    private String email;
    private String firstName;
    private String lastName;

    public UserDto(Long id, String username, String email, String firstName, String lastName) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    /** Même logique que le frontend AuthService.getNumericUserId() */
    public static Long keycloakSubToNumericId(String keycloakId) {
        if (keycloakId == null || keycloakId.isBlank()) return 1L;
        String clean = keycloakId.replace("-", "");
        if (clean.isEmpty()) return 1L;
        try {
            // Si c'est un nombre décimal (ex: "357586579"), utiliser tel quel
            if (clean.matches("\\d+")) {
                long n = Long.parseLong(clean);
                return Math.abs(n) == 0 ? 1L : Math.abs(n);
            }
            // Sinon traiter comme UUID hex (ex: "f47ac10b58cc...")
            String hex = clean.substring(0, Math.min(8, clean.length()));
            long n = Long.parseLong(hex, 16);
            return Math.abs(n) == 0 ? 1L : Math.abs(n);
        } catch (NumberFormatException e) {
            return 1L;
        }
    }
}
