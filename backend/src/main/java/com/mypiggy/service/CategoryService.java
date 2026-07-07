package com.mypiggy.service;

import com.mypiggy.dto.CategoryRequestDTO;
import com.mypiggy.dto.CategoryResponseDTO;
import com.mypiggy.exception.ResourceNotFoundException;
import com.mypiggy.exception.ValidationException;
import com.mypiggy.model.Category;
import com.mypiggy.model.User;
import com.mypiggy.repository.CategoryRepository;
import com.mypiggy.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    public List<CategoryResponseDTO> listByUser(UUID userId) {
        return categoryRepository.findByUserIdOrIsDefaultTrue(userId)
                .stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }

    public CategoryResponseDTO create(CategoryRequestDTO request, UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));

        if (categoryRepository.existsByNameAndUserId(request.getName(), userId)) {
            throw new ValidationException("Já existe uma categoria com esse nome");
        }

        Category category = new Category();
        category.setUser(user);
        category.setName(request.getName());
        category.setDescription(request.getDescription());
        category.setColor(request.getColor());
        category.setIcon(request.getIcon());
        category.setIsDefault(false);

        Category saved = categoryRepository.save(category);
        return toResponseDTO(saved);
    }

    public CategoryResponseDTO update(Integer categoryId, CategoryRequestDTO request, UUID userId) {
        Category category = categoryRepository.findByIdAndUserId(categoryId, userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                    "Categoria não encontrada ou não pode ser editada"));

        category.setName(request.getName());
        category.setDescription(request.getDescription());
        category.setColor(request.getColor());
        category.setIcon(request.getIcon());

        Category updated = categoryRepository.save(category);
        return toResponseDTO(updated);
    }

    public void delete(Integer categoryId, UUID userId) {
        Category category = categoryRepository.findByIdAndUserId(categoryId, userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                    "Categoria não encontrada ou não pode ser excluída"));

        categoryRepository.delete(category);
    }

    private CategoryResponseDTO toResponseDTO(Category category) {
        CategoryResponseDTO dto = new CategoryResponseDTO();
        dto.setId(category.getId());
        dto.setName(category.getName());
        dto.setDescription(category.getDescription());
        dto.setColor(category.getColor());
        dto.setIcon(category.getIcon());
        dto.setIsDefault(category.getIsDefault());
        return dto;
    }
}