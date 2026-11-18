package com.mypiggy.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
public class PiggyBankResponseDTO {

    private UUID id;
    private String name;
    private String description;
    private String icon;
    private String color;

    private Long goalInCents;          // nulo = sem meta
    private LocalDate targetDate;
    private BigDecimal annualRate;     // % ao ano; nulo = sem rendimento
    private Boolean isEmergency;

    private Long balanceInCents;          // valor guardado (soma das movimentações)
    private Long estimatedYieldInCents;   // rendimento estimado até hoje (0 sem taxa)
    private Long totalInCents;            // balance + rendimento estimado

    private Double progressPercent;       // total / meta * 100 (1 casa); nulo se não há meta
    private Boolean goalReached;          // true se há meta e total >= meta

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}