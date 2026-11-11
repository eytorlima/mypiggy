package com.mypiggy.controller;

import com.mypiggy.dto.ApiResponse;
import com.mypiggy.dto.PiggyBankMovementRequestDTO;
import com.mypiggy.dto.PiggyBankMovementResponseDTO;
import com.mypiggy.dto.PiggyBankRequestDTO;
import com.mypiggy.dto.PiggyBankResponseDTO;
import com.mypiggy.model.User;
import com.mypiggy.service.PiggyBankService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/piggybanks")
@RequiredArgsConstructor
public class PiggyBankController {

    private final PiggyBankService piggyBankService;

    // Lista os porquinhos do usuário (reserva de emergência primeiro)
    @GetMapping
    public ResponseEntity<ApiResponse<List<PiggyBankResponseDTO>>> list(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success("Porquinhos listados",
                piggyBankService.listByUser(user.getId())));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PiggyBankResponseDTO>> getById(
            @AuthenticationPrincipal User user, @PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success("Porquinho encontrado",
                piggyBankService.getById(id, user.getId())));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PiggyBankResponseDTO>> create(
            @AuthenticationPrincipal User user, @Valid @RequestBody PiggyBankRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Porquinho criado",
                piggyBankService.create(request, user.getId())));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PiggyBankResponseDTO>> update(
            @AuthenticationPrincipal User user, @PathVariable UUID id,
            @Valid @RequestBody PiggyBankRequestDTO request) {
        return ResponseEntity.ok(ApiResponse.success("Porquinho atualizado",
                piggyBankService.update(id, request, user.getId())));
    }

    // Se o porquinho tiver dinheiro, returnAccountId indica a conta que recebe o valor
    // DELETE /api/piggybanks/{id}?returnAccountId=...
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @AuthenticationPrincipal User user, @PathVariable UUID id,
            @RequestParam(required = false) UUID returnAccountId) {
        piggyBankService.delete(id, returnAccountId, user.getId());
        return ResponseEntity.ok(ApiResponse.success("Porquinho excluído", null));
    }

    // Guardar dinheiro: sai da conta (accountId) e entra no porquinho
    @PostMapping("/{id}/deposit")
    public ResponseEntity<ApiResponse<PiggyBankResponseDTO>> deposit(
            @AuthenticationPrincipal User user, @PathVariable UUID id,
            @Valid @RequestBody PiggyBankMovementRequestDTO request) {
        return ResponseEntity.ok(ApiResponse.success("Valor guardado",
                piggyBankService.deposit(id, request, user.getId())));
    }

    // Retirar dinheiro: sai do porquinho e volta para a conta (accountId)
    @PostMapping("/{id}/withdraw")
    public ResponseEntity<ApiResponse<PiggyBankResponseDTO>> withdraw(
            @AuthenticationPrincipal User user, @PathVariable UUID id,
            @Valid @RequestBody PiggyBankMovementRequestDTO request) {
        return ResponseEntity.ok(ApiResponse.success("Valor retirado",
                piggyBankService.withdraw(id, request, user.getId())));
    }

    // Histórico de depósitos e retiradas (tela de detalhes)
    @GetMapping("/{id}/movements")
    public ResponseEntity<ApiResponse<List<PiggyBankMovementResponseDTO>>> movements(
            @AuthenticationPrincipal User user, @PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success("Movimentações listadas",
                piggyBankService.listMovements(id, user.getId())));
    }
}