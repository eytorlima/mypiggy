package com.mypiggy.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Getter;
import lombok.Setter;

// Corpo de PUT /api/piggybanks/{id}/balance
@Getter
@Setter
public class PiggyBankBalanceRequestDTO {

    @NotNull(message = "O valor é obrigatório")
    @PositiveOrZero(message = "O valor não pode ser negativo")
    private Long balanceInCents;
}