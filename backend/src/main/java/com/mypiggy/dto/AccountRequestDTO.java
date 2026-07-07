package com.mypiggy.dto;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AccountRequestDTO {

    @NotBlank(message = "Nome é obrigatório")
    @Size(max = 100)
    private String name;

    @NotBlank(message = "Tipo de conta é obrigatório")
    private String accountType; // BANK_ACCOUNT, CHECKING_ACCOUNT, SAVINGS_ACCOUNT, WALLET

    private Long balanceInCents = 0L;

    @Pattern(
        regexp = "^(green|blue|purple|red|orange|pink|yellow|gray)$",
        message = "Cor inválida"
    )
    private String color;

    @Pattern(
        regexp = "^(bank|wallet|savings|digital)$",
        message = "Ícone inválido. Use: bank, wallet, savings ou digital"
    )
    private String icon;

    // Campos específicos de BankAccount
    private String agency;
    private String accountNumber;
    private String branchNumber;

    // Específico de CheckingAccount
    private Long creditLimitInCents;

    // Específico de SavingsAccount
    private Long withdrawalLimitInCents;
}