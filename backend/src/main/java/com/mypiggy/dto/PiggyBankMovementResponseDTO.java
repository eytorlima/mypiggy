package com.mypiggy.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
public class PiggyBankMovementResponseDTO {

    private UUID id;
    private String movementType;   // DEPOSIT, WITHDRAWAL
    private Long amountInCents;
    private LocalDateTime movementDate;

    private UUID accountId;        // nulo se a conta foi excluída
    private String accountName;

    private LocalDateTime createdAt;
}