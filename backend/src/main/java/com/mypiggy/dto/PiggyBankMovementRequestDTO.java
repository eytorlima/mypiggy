package com.mypiggy.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

// Corpo de POST /api/piggybanks/{id}/deposit e /withdraw
@Getter
@Setter
public class PiggyBankMovementRequestDTO {

    // Depósito: conta de onde o dinheiro sai. Retirada: conta que recebe o dinheiro.
    @NotNull(message = "A conta é obrigatória")
    private UUID accountId;

    @NotNull(message = "O valor é obrigatório")
    @Positive(message = "O valor deve ser maior que zero")
    private Long amountInCents;
}