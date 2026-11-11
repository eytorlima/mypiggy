package com.mypiggy.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class PiggyBankRequestDTO {

    @NotBlank(message = "O nome é obrigatório")
    @Size(max = 100, message = "O nome deve ter no máximo 100 caracteres")
    private String name;

    @Size(max = 255, message = "A descrição deve ter no máximo 255 caracteres")
    private String description;

    @Size(max = 50, message = "Ícone inválido")
    private String icon;

    @Size(max = 20, message = "Cor inválida")
    private String color;

    // Nulo = porquinho sem meta. Preenchido = meta (precisa ser maior que zero)
    @Positive(message = "A meta deve ser maior que zero")
    private Long goalInCents;

    // Prazo da meta (só vale se houver goalInCents)
    private LocalDate targetDate;

    // Rendimento em % ao ano (ex.: 10.5 = 10,5% a.a.); nulo = sem rendimento
    @DecimalMin(value = "0.0", message = "A taxa de rendimento não pode ser negativa")
    @Digits(integer = 3, fraction = 4, message = "Taxa inválida (máximo 999,9999)")
    private BigDecimal annualRate;
}