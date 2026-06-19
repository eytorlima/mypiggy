package com.mypiggy.controller;

import com.mypiggy.dto.ApiResponse;
import com.mypiggy.dto.AuthResponseDTO;
import com.mypiggy.dto.LoginRequestDTO;
import com.mypiggy.dto.RegisterRequestDTO;
import com.mypiggy.exception.UnauthorizedException;
import com.mypiggy.model.User;
import com.mypiggy.service.AuthService;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("api/auth")
@RequiredArgsConstructor
public class AuthController {
    
    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponseDTO>> register(
            @Valid @RequestBody RegisterRequestDTO request) {

        AuthResponseDTO response = authService.register(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Usuário registrado com sucesso!", response));
    }
    
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponseDTO>> login(
            @Valid @RequestBody LoginRequestDTO request) {

        AuthResponseDTO response = authService.login(request);

        return ResponseEntity
                .ok(ApiResponse.success("LogIn realizado com sucesso!", response));
    }


    @GetMapping("/me")
    public ResponseEntity<ApiResponse<AuthResponseDTO>> me(
            @AuthenticationPrincipal User user) {

        if (user == null){
            throw new UnauthorizedException("Não autenticado");
        }

        AuthResponseDTO response = new AuthResponseDTO(
            null, //sem token
            user.getId(),
            user.getName(),
            user.getEmail()
        );


        return ResponseEntity.ok(ApiResponse.success("Usuário autenticado!", response));

    }
}