package com.mypiggy.dto;

import java.util.List;
import java.util.UUID;

/**
 * Respostas dos endpoints de /api/reports.
 *
 * Cada endpoint devolve seu próprio tipo (agrupados aqui para manter um único arquivo),
 * assim nenhuma resposta traz campos nulos de outro relatório.
 * Todos os valores monetários estão em centavos, sempre positivos (o sinal depende do tipo).
 */
public final class ReportResponseDTO {

    private ReportResponseDTO() {
    }

    /* ---------- GET /api/reports/by-category ---------- */

    public record CategoryItem(
            Integer categoryId,      // null = transações sem categoria
            String name,
            String color,
            String icon,
            long totalInCents,
            double percentage,       // 0 a 100, uma casa decimal
            long transactionCount) {
    }

    public record CategoryReport(
            String month,            // "2026-11"
            String type,             // "DEBIT" ou "CREDIT"
            long totalInCents,       // soma de todos os itens
            List<CategoryItem> items) {
    }

    /* ---------- GET /api/reports/monthly ---------- */

    public record MonthlyItem(
            String month,            // "2026-11"
            long incomeInCents,
            long expenseInCents,
            long netInCents) {       // receitas - despesas
    }

    public record MonthlyReport(
            int months,
            long totalIncomeInCents,
            long totalExpenseInCents,
            List<MonthlyItem> items) {
    }

    /* ---------- GET /api/reports/balance-history ---------- */

    public record BalancePoint(
            String month,            // "2026-11"
            long balanceInCents) {   // saldo ao fim do mês (o mês atual = saldo de hoje)
    }

    public record BalanceHistory(
            UUID accountId,          // null = saldo consolidado de todas as contas
            int months,
            List<BalancePoint> points) {
    }
}