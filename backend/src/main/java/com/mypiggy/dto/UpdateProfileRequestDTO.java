package com.mypiggy.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import lombok.Getter;
import lombok.Setter;

// Todos os campos são opcionais: o front envia só o que o usuário quer alterar.
//   - Trocar nome:  { "name": "..." }
//   - Trocar senha: { "currentPassword": "...", "newPassword": "..." }
@Getter
@Setter
public class UpdateProfileRequestDTO {

    @Size(max = 100, message = "Nome não pode ter mais de 100 caracteres")
    private String name;

    private String currentPassword;

    // Mesma regra de senha do cadastro (RegisterRequestDTO)
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^a-zA-Z0-9]).{8,}$",
        message = "Senha deve ter no mínimo 8 caracteres, incluindo maiúscula, minúscula, número e caractere especial"
    )
    private String newPassword;
}