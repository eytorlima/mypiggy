package com.mypiggy.repository;

import com.mypiggy.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Integer> {

    // Retorna categorias padrão + categorias do usuário
    List<Category> findByUserIdOrIsDefaultTrue(UUID userId);

    // Busca categoria por ID garantindo que é do usuário ou é padrão
    Optional<Category> findByIdAndUserId(Integer id, UUID userId);

    // Verifica se já existe categoria com esse nome para o usuário
    boolean existsByNameAndUserId(String name, UUID userId);
}