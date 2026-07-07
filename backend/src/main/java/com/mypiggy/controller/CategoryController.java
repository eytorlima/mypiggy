package com.mypiggy.controller;

import com.mypiggy.dto.ApiResponse;
import com.mypiggy.dto.CategoryRequestDTO;
import com.mypiggy.dto.CategoryResponseDTO;
import com.mypiggy.model.User;
import com.mypiggy.service.CategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CategoryResponseDTO>>> listAll(
            @AuthenticationPrincipal User user) {

        List<CategoryResponseDTO> categories = categoryService.listByUser(user.getId());
        return ResponseEntity.ok(ApiResponse.success("Categorias listadas com sucesso", categories));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CategoryResponseDTO>> create(
            @Valid @RequestBody CategoryRequestDTO request,
            @AuthenticationPrincipal User user) {

        CategoryResponseDTO response = categoryService.create(request, user.getId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Categoria criada com sucesso", response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CategoryResponseDTO>> update(
            @PathVariable Integer id,
            @Valid @RequestBody CategoryRequestDTO request,
            @AuthenticationPrincipal User user) {

        CategoryResponseDTO updated = categoryService.update(id, request, user.getId());
        return ResponseEntity.ok(ApiResponse.success("Categoria atualizada com sucesso", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Integer id,
            @AuthenticationPrincipal User user) {

        categoryService.delete(id, user.getId());
        return ResponseEntity.ok(ApiResponse.success("Categoria excluída com sucesso", null));
    }
}