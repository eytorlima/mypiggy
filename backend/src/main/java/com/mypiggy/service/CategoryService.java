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

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryService {

    // Ícone reservado: identifica a categoria de sistema usada nas transferências
    private static final String TRANSFER_ICON = "transfer";

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

        String name = request.getName().trim();
        validateIcon(request.getIcon());
        validateUniqueName(name, userId, null);

        Category category = new Category();
        category.setUser(user);
        category.setName(name);
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

        String name = request.getName().trim();
        validateIcon(request.getIcon());
        // Ignora a própria categoria: salvar sem trocar o nome continua permitido
        validateUniqueName(name, userId, categoryId);

        category.setName(name);
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

        // Regra de negócio: excluir é permitido mesmo com transações vinculadas.
        // As transações permanecem e ficam sem categoria (FK com ON DELETE SET NULL).
        // O aviso ao usuário é feito na tela, antes da confirmação.
        categoryRepository.delete(category);
    }

    // O ícone "transfer" identifica a categoria de sistema; usuário não pode criar outra com ele
    private void validateIcon(String icon) {
        if (TRANSFER_ICON.equals(icon)) {
            throw new ValidationException("Este ícone é reservado pelo sistema");
        }
    }

    // Compara com TODAS as categorias visíveis ao usuário (padrão + próprias).
    // A comparação usa o nome normalizado (ver normalizeName), então variações de
    // maiúsculas, acentos, espaços e símbolos contam como o mesmo nome.
    // ignoreId = categoria que está sendo editada (null ao criar).
    private void validateUniqueName(String name, UUID userId, Integer ignoreId) {
        String normalized = normalizeName(name);

        if (normalized.isEmpty()) {
            throw new ValidationException("O nome deve conter letras ou números");
        }

        boolean exists = categoryRepository.findByUserIdOrIsDefaultTrue(userId)
                .stream()
                .anyMatch(c -> !c.getId().equals(ignoreId)
                        && normalizeName(c.getName()).equals(normalized));

        if (exists) {
            throw new ValidationException(
                    "Já existe uma categoria com esse nome (ou muito parecido)");
        }
    }

    // "Alimentação", "ALIMENTACAO", " alimen-tação " -> "alimentacao"
    // 1) separa letra e acento (NFD) e remove os acentos
    // 2) deixa tudo em minúsculas
    // 3) mantém só letras e números (remove espaços, hífens e símbolos)
    private String normalizeName(String value) {
        String semAcento = Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        return semAcento.toLowerCase(Locale.ROOT).replaceAll("[^\\p{L}\\p{N}]", "");
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