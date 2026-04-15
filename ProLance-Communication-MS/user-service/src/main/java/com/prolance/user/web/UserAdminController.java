package com.prolance.user.web;

import com.prolance.user.dto.UserDtos;
import com.prolance.user.service.UserAdminService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserAdminController {

    private final UserAdminService userAdminService;

    public UserAdminController(UserAdminService userAdminService) {
        this.userAdminService = userAdminService;
    }

    @GetMapping("/admin/users")
    public List<UserDtos.UserResponse> listUsers() {
        return userAdminService.listAll();
    }

    @GetMapping("/admin/users/{id}")
    public UserDtos.UserResponse getUser(@PathVariable Long id) {
        return userAdminService.getById(id);
    }

    @PostMapping("/admin/users")
    public UserDtos.UserResponse createUser(@Valid @RequestBody UserDtos.AdminCreateUserRequest request) {
        return userAdminService.create(request);
    }

    @PutMapping("/admin/users/{id}")
    public UserDtos.UserResponse updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UserDtos.AdminUpdateUserRequest request) {
        return userAdminService.update(id, request);
    }

    @DeleteMapping("/admin/users/{id}")
    public void deleteUser(@PathVariable Long id) {
        userAdminService.delete(id);
    }
}
