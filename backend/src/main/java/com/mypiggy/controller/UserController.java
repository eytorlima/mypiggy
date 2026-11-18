package com.mypiggy.controller;

import com.mypiggy.dto.ApiResponse;
import com.mypiggy.dto.UpdateProfileRequestDTO;
import com.mypiggy.dto.UserProfileResponseDTO;
import com.mypiggy.dto.UserSettingsRequestDTO;
import com.mypiggy.dto.UserSettingsResponseDTO;
import com.mypiggy.model.User;
import com.mypiggy.service.UserService;
import com.mypiggy.service.UserSettingsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final UserSettingsService userSettingsService;

    @GetMapping("/settings")
    public ResponseEntity<ApiResponse<UserSettingsResponseDTO>> getSettings(
            @AuthenticationPrincipal User user) {

        UserSettingsResponseDTO settings = userSettingsService.getSettings(user);
        return ResponseEntity.ok(ApiResponse.success("Configurações carregadas", settings));
    }

    @PutMapping("/settings")
    public ResponseEntity<ApiResponse<UserSettingsResponseDTO>> updateSettings(
            @Valid @RequestBody UserSettingsRequestDTO request,
            @AuthenticationPrincipal User user) {

        UserSettingsResponseDTO updated = userSettingsService.update(user, request);
        return ResponseEntity.ok(ApiResponse.success("Configurações atualizadas com sucesso", updated));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<UserProfileResponseDTO>> updateProfile(
            @Valid @RequestBody UpdateProfileRequestDTO request,
            @AuthenticationPrincipal User user) {

        UserProfileResponseDTO updated = userService.updateProfile(user.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Perfil atualizado com sucesso", updated));
    }
}