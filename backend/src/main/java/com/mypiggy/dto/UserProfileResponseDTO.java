package com.mypiggy.dto;

import java.util.UUID;

// Devolvido após atualizar o perfil: o front usa para atualizar o nome no AuthContext
public record UserProfileResponseDTO(
    UUID id,
    String name,
    String email
) {}