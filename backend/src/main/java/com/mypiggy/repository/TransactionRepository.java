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
        // Busca transações com filtros opcionais e pesquisa de texto (search já vem como %termo%, minúsculo)
    @Query(value = """
        SELECT t.* FROM transactions t
        JOIN accounts a ON a.id = t.account_id
        LEFT JOIN accounts da ON da.id = t.destination_account_id
        LEFT JOIN categories c ON c.id = t.category_id
        WHERE a.user_id = CAST(:userId AS uuid)
        AND (:accountId IS NULL OR t.account_id = CAST(:accountId AS uuid))
        AND (:type IS NULL OR t.transaction_type = :type)
        AND (:categoryId IS NULL OR t.category_id = :categoryId)
        AND (CAST(:startDate AS timestamp) IS NULL OR t.transaction_date >= CAST(:startDate AS timestamp))
        AND (CAST(:endDate AS timestamp) IS NULL OR t.transaction_date <= CAST(:endDate AS timestamp))
        AND (CAST(:search AS text) IS NULL
             OR LOWER(COALESCE(t.description, '')) LIKE CAST(:search AS text)
             OR LOWER(a.name) LIKE CAST(:search AS text)
             OR LOWER(COALESCE(da.name, '')) LIKE CAST(:search AS text)
             OR LOWER(COALESCE(c.name, '')) LIKE CAST(:search AS text)
             OR LOWER(COALESCE(t.tags, '')) LIKE CAST(:search AS text))
        ORDER BY t.transaction_date DESC
        """, nativeQuery = true)
    List<Transaction> findWithFilters(
        @Param("userId") UUID userId,
        @Param("accountId") UUID accountId,
        @Param("type") String type,
        @Param("categoryId") Integer categoryId,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate,
        @Param("search") String search
    );

    // Todas as ocorrências geradas a partir de uma original (da mais antiga à mais nova)
    List<Transaction> findByRecurrenceParentOrderByTransactionDateAsc(Transaction parent);

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

    /* ------------------------------------------------------------------ */
    /* Relatórios (usados por ReportService)                               */
    /* ------------------------------------------------------------------ */

    /**
     * Total por categoria no intervalo [startDate, endDate).
     * Linha: [0]=category id (null = sem categoria), [1]=nome, [2]=cor, [3]=ícone,
     *        [4]=total em centavos, [5]=quantidade de transações.
     */
    @Query("""
        SELECT c.id, c.name, c.color, c.icon, SUM(t.amountInCents), COUNT(t)
        FROM Transaction t
        LEFT JOIN t.category c
        WHERE t.account.user.id = :userId
        AND t.transactionType = :type
        AND t.transactionDate >= :startDate
        AND t.transactionDate < :endDate
        GROUP BY c.id, c.name, c.color, c.icon
        """)
    List<Object[]> sumByCategory(
        @Param("userId") UUID userId,
        @Param("type") String type,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );

    /**
     * Receitas e despesas por mês no intervalo [startDate, endDate).
     * Linha: [0]=ano, [1]=mês, [2]=tipo (CREDIT/DEBIT), [3]=total em centavos.
     * Só devolve meses com movimento; o service completa os demais com 0.
     */
    @Query("""
        SELECT YEAR(t.transactionDate), MONTH(t.transactionDate), t.transactionType, SUM(t.amountInCents)
        FROM Transaction t
        WHERE t.account.user.id = :userId
        AND t.transactionDate >= :startDate
        AND t.transactionDate < :endDate
        AND t.transactionType IN ('CREDIT', 'DEBIT')
        GROUP BY YEAR(t.transactionDate), MONTH(t.transactionDate), t.transactionType
        """)
    List<Object[]> sumByMonthAndType(
        @Param("userId") UUID userId,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );

    /**
     * Efeito no saldo da conta de ORIGEM, por mês, a partir de startDate (sem limite superior,
     * para incluir transações com data futura).
     * CREDIT e piggy somam; DEBIT e TRANSFER (saída) subtraem.
     * Linha: [0]=id da conta, [1]=ano, [2]=mês, [3]=efeito em centavos (pode ser negativo).
     */
    @Query("""
        SELECT t.account.id, YEAR(t.transactionDate), MONTH(t.transactionDate),
               SUM(CASE WHEN t.transactionType IN ('CREDIT', 'PIGGY_WITHDRAWAL') THEN t.amountInCents
                        ELSE -t.amountInCents END)
        FROM Transaction t
        WHERE t.account.user.id = :userId
        AND t.transactionDate >= :startDate
        GROUP BY t.account.id, YEAR(t.transactionDate), MONTH(t.transactionDate)
        """)
    List<Object[]> sumSourceEffects(
        @Param("userId") UUID userId,
        @Param("startDate") LocalDateTime startDate
    );

    /**
     * Efeito no saldo da conta de DESTINO das transferências, por mês, a partir de startDate.
     * Linha: [0]=id da conta destino, [1]=ano, [2]=mês, [3]=total recebido em centavos.
     */
    @Query("""
        SELECT t.destinationAccount.id, YEAR(t.transactionDate), MONTH(t.transactionDate),
               SUM(t.amountInCents)
        FROM Transaction t
        WHERE t.account.user.id = :userId
        AND t.transactionType = 'TRANSFER'
        AND t.destinationAccount IS NOT NULL
        AND t.transactionDate >= :startDate
        GROUP BY t.destinationAccount.id, YEAR(t.transactionDate), MONTH(t.transactionDate)
    """)
    List<Object[]> sumIncomingTransfers(
        @Param("userId") UUID userId,
        @Param("startDate") LocalDateTime startDate
    );

    @Query("""
        SELECT t FROM Transaction t
        JOIN FETCH t.account a
        LEFT JOIN FETCH t.category
        LEFT JOIN FETCH t.destinationAccount
        WHERE a.user.id = :userId
        AND t.transactionDate >= :startDate
        AND t.transactionDate < :endDate
        ORDER BY t.transactionDate ASC, t.createdAt ASC
    """)
    List<Transaction> findForExport(@Param("userId") UUID userId,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate);
}