package com.mypiggy.controller;

import com.mypiggy.dto.ApiResponse;
import com.mypiggy.dto.TransactionRequestDTO;
import com.mypiggy.dto.TransactionResponseDTO;
import com.mypiggy.model.User;
import com.mypiggy.service.TransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;

    @PostMapping
    public ResponseEntity<ApiResponse<TransactionResponseDTO>> create(
            @Valid @RequestBody TransactionRequestDTO request,
            @AuthenticationPrincipal User user) {

        TransactionResponseDTO response = transactionService.create(request, user.getId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Transação criada com sucesso", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<TransactionResponseDTO>>> listAll(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) UUID accountId,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) Integer categoryId,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {

        List<TransactionResponseDTO> transactions = transactionService.listWithFilters(
                user.getId(), accountId, type, categoryId, startDate, endDate);

        return ResponseEntity.ok(ApiResponse.success("Transações listadas com sucesso", transactions));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TransactionResponseDTO>> update(
            @PathVariable UUID id,
            @Valid @RequestBody TransactionRequestDTO request,
            @AuthenticationPrincipal User user) {

        TransactionResponseDTO updated = transactionService.update(id, request, user.getId());
        return ResponseEntity.ok(ApiResponse.success("Transação atualizada com sucesso", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user) {

        transactionService.delete(id, user.getId());
        return ResponseEntity.ok(ApiResponse.success("Transação excluída com sucesso", null));
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getMonthlySummary(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int month,
            @RequestParam(defaultValue = "0") int year) {

        int m = month == 0 ? LocalDateTime.now().getMonthValue() : month;
        int y = year == 0 ? LocalDateTime.now().getYear() : year;

        Map<String, Long> summary = transactionService.getMonthlySummary(user.getId(), m, y);
        return ResponseEntity.ok(ApiResponse.success("Resumo calculado", summary));
    }
}