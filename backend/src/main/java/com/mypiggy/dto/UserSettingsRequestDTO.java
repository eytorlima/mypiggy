package com.mypiggy.dto;

import jakarta.validation.constraints.NotNull;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserSettingsRequestDTO {

    // Único campo editável: moeda, idioma e fuso são fixos (BRL, pt-BR, America/Sao_Paulo)
    @NotNull(message = "notificationEnabled é obrigatório")
    private Boolean notificationEnabled;
}