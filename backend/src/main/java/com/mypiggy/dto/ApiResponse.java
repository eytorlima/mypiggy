package com.mypiggy.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor

public class ApiResponse<T> {
    
    private String status; // deve retornar success ou error
    private String message; // mensagem de erro ou sucesso
    private T data; // dados retornados (pode ser null em caso de erro)

    public static <T> ApiResponse<T> success(String message, T data) {
        return new ApiResponse<>("success", message, data);
    }
    
    public static <T> ApiResponse<T> error(String message) {
        return new ApiResponse<>("error", message, null);
    }
}
