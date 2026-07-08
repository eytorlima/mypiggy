package com.mypiggy.dto;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
public class TransactionRequestDTO {

    @NotNull(message = "Conta é obrigatória")
    private UUID accountId;

    private UUID destinationAccountId; // apenas para TRANSFER

    private Integer categoryId;

    @NotNull(message = "Valor é obrigatório")
    @Positive(message = "Valor deve ser positivo")
    private Long amountInCents;

    private String description;

    @NotNull(message = "Data é obrigatória")
    private LocalDateTime transactionDate;

    @NotBlank(message = "Tipo é obrigatório")
    @Pattern(regexp = "^(CREDIT|DEBIT|TRANSFER)$",
             message = "Tipo deve ser CREDIT, DEBIT ou TRANSFER")
    private String transactionType;

    private Boolean isRecurring = false;

    @Pattern(regexp = "^(DAILY|WEEKLY|MONTHLY|ANNUAL)$",
             message = "Recorrência deve ser DAILY, WEEKLY, MONTHLY ou ANNUAL")
    private String recurrencyType;

    private String tags;
}