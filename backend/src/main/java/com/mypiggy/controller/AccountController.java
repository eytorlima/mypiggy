package com.mypiggy.controller;

import com.mypiggy.dto.AccountRequestDTO;
import com.mypiggy.dto.AccountResponseDTO;
import com.mypiggy.dto.ApiResponse;
import com.mypiggy.model.User;
import com.mypiggy.service.AccountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/accounts")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService accountService;

    @PostMapping
    public ResponseEntity<ApiResponse<AccountResponseDTO>> create(
            @Valid @RequestBody AccountRequestDTO request,
            @AuthenticationPrincipal User user) {

        AccountResponseDTO response = accountService.create(request, user.getId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Conta criada com sucesso", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<AccountResponseDTO>>> listAll(
            @AuthenticationPrincipal User user) {

        List<AccountResponseDTO> accounts = accountService.listByUser(user.getId());
        return ResponseEntity.ok(ApiResponse.success("Contas listadas com sucesso", accounts));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AccountResponseDTO>> getById(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user) {

        AccountResponseDTO account = accountService.getById(id, user.getId());
        return ResponseEntity.ok(ApiResponse.success("Conta encontrada", account));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<AccountResponseDTO>> update(
            @PathVariable UUID id,
            @Valid @RequestBody AccountRequestDTO request,
            @AuthenticationPrincipal User user) {

        AccountResponseDTO updated = accountService.update(id, request, user.getId());
        return ResponseEntity.ok(ApiResponse.success("Conta atualizada com sucesso", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user) {

        accountService.delete(id, user.getId());
        return ResponseEntity.ok(ApiResponse.success("Conta excluída com sucesso", null));
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<Long>> getSummary(
            @AuthenticationPrincipal User user) {

        Long totalBalance = accountService.getSummary(user.getId());
        return ResponseEntity.ok(ApiResponse.success("Resumo calculado", totalBalance));
    }
}