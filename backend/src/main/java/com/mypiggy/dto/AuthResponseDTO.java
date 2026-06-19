package com.mypiggy.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.UUID;

@Getter
@AllArgsConstructor
public class AuthResponseDTO {
    
    private String token;
    private UUID id;
    private String name;
    private String email;
}
