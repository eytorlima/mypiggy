package com.mypiggy.repository;

import com.mypiggy.model.PiggyBankMovement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PiggyBankMovementRepository extends JpaRepository<PiggyBankMovement, UUID> {

    // Movimentações de UM porquinho, da mais recente para a mais antiga (tela de detalhes)
    @Query("""
        SELECT m FROM PiggyBankMovement m
        LEFT JOIN FETCH m.account
        WHERE m.piggyBank.id = :piggyBankId
        ORDER BY m.movementDate DESC, m.createdAt DESC
        """)
    List<PiggyBankMovement> findAllByPiggyBankId(@Param("piggyBankId") UUID piggyBankId);

    // Movimentações de TODOS os porquinhos do usuário, numa só consulta (lista/Dashboard)
    @Query("""
        SELECT m FROM PiggyBankMovement m
        WHERE m.piggyBank.user.id = :userId
        """)
    List<PiggyBankMovement> findAllByUserId(@Param("userId") UUID userId);

    void deleteAllByPiggyBankId(UUID piggyBankId);
}