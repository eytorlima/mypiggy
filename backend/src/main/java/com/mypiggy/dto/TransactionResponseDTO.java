package com.mypiggy.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
public class TransactionResponseDTO {

    private UUID id;
    private UUID accountId;
    private String accountName;
    private UUID destinationAccountId;
    private String destinationAccountName;
    private Integer categoryId;
    private String categoryName;
    private String categoryColor;
    private String categoryIcon;
    private Long amountInCents;
    private String description;
    private LocalDateTime transactionDate;
    private String transactionType;
    private Boolean isRecurring;
    private String recurrencyType;
    private String tags;
    private LocalDateTime createdAt;
}