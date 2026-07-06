package com.mypiggy.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AccountResponseDTO {

    private UUID id;
    private String name;
    private String accountType;
    private Long balanceInCents;

    // Campos específicos (null se não aplicável ao tipo)
    private String agency;
    private String accountNumber;
    private String branchNumber;
    private Long creditLimitInCents;
    private Long withdrawalLimitInCents;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}