package com.mypiggy.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CategoryRequestDTO {

    @NotBlank(message = "Nome é obrigatório")
    @Size(max = 18, message = "Nome pode ter no máximo 18 letras")
    @Pattern(
        regexp = "^\\p{L}+$",
        message = "Use apenas letras, sem espaços, números ou símbolos"
    )
    private String name;

    @Size(max = 255)
    private String description;

    @Pattern(
        regexp = "^(green|blue|purple|red|orange|pink|yellow|gray)$",
        message = "Cor inválida. Use: green, blue, purple, red, orange, pink, yellow ou gray"
    )
    private String color;

    @Pattern(
        regexp = "^(utensils|car|home|heart|school|smile|shirt|repeat|pet|tax|briefcase|laptop|trending|gift|transfer|other|bank|wallet|savings|digital)$",
        message = "Ícone inválido"
    )
    private String icon;

}