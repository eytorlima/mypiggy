package com.mypiggy.repository;

import com.mypiggy.model.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, UUID> {

    // Busca transações com filtros opcionais
    @Query(value = """
        SELECT t.* FROM transactions t
        JOIN accounts a ON a.id = t.account_id
        WHERE a.user_id = CAST(:userId AS uuid)
        AND (:accountId IS NULL OR t.account_id = CAST(:accountId AS uuid))
        AND (:type IS NULL OR t.transaction_type = :type)
        AND (:categoryId IS NULL OR t.category_id = :categoryId)
        AND (CAST(:startDate AS timestamp) IS NULL OR t.transaction_date >= CAST(:startDate AS timestamp))
        AND (CAST(:endDate AS timestamp) IS NULL OR t.transaction_date <= CAST(:endDate AS timestamp))
        ORDER BY t.transaction_date DESC
        """, nativeQuery = true)
    List<Transaction> findWithFilters(
        @Param("userId") UUID userId,
        @Param("accountId") UUID accountId,
        @Param("type") String type,
        @Param("categoryId") Integer categoryId,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );

    // Resumo mensal: total de CREDIT e DEBIT
    @Query("""
        SELECT t.transactionType, COALESCE(SUM(t.amountInCents), 0)
        FROM Transaction t
        WHERE t.account.user.id = :userId
        AND t.transactionDate >= :startDate
        AND t.transactionDate <= :endDate
        AND t.transactionType IN ('CREDIT', 'DEBIT')
        GROUP BY t.transactionType
        """)
    List<Object[]> getMonthlySummary(
        @Param("userId") UUID userId,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );

    // Busca por ID garantindo que pertence ao usuário
    @Query("""
        SELECT t FROM Transaction t
        WHERE t.id = :id
        AND t.account.user.id = :userId
        """)
    Optional<Transaction> findByIdAndUserId(
        @Param("id") UUID id,
        @Param("userId") UUID userId
    );
}