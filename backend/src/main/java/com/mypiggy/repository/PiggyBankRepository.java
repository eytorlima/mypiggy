package com.mypiggy.repository;

import com.mypiggy.model.PiggyBank;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PiggyBankRepository extends JpaRepository<PiggyBank, UUID> {

    List<PiggyBank> findAllByUserId(UUID userId);

    // Garante que o porquinho pertence ao usuário autenticado
    Optional<PiggyBank> findByIdAndUserId(UUID id, UUID userId);
}