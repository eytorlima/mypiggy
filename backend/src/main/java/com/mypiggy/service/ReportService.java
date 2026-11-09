package com.mypiggy.service;

import com.mypiggy.dto.ReportResponseDTO;
import com.mypiggy.exception.ResourceNotFoundException;
import com.mypiggy.exception.ValidationException;
import com.mypiggy.model.Account;
import com.mypiggy.repository.AccountRepository;
import com.mypiggy.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReportService {

    private static final int MAX_MONTHS = 24;
    private static final String DEBIT = "DEBIT";
    private static final String CREDIT = "CREDIT";

    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;

    /* ------------------------------------------------------------------ */
    /* GET /api/reports/by-category                                        */
    /* ------------------------------------------------------------------ */

    @Transactional(readOnly = true)
    public ReportResponseDTO.CategoryReport getByCategory(UUID userId, String month, String type) {
        YearMonth period = parseMonth(month);
        String txType = parseType(type);

        // Intervalo semiaberto [início do mês, início do mês seguinte)
        List<Object[]> rows = transactionRepository.sumByCategory(
                userId, txType, startOf(period), startOf(period.plusMonths(1)));

        long total = 0;
        for (Object[] row : rows) {
            total += toLong(row[4]);
        }

        List<ReportResponseDTO.CategoryItem> items = new ArrayList<>();
        for (Object[] row : rows) {
            Integer categoryId = row[0] == null ? null : ((Number) row[0]).intValue();
            long amount = toLong(row[4]);

            // Transações sem categoria entram como "Sem categoria", senão a soma das
            // fatias não bateria com o total gasto
            items.add(new ReportResponseDTO.CategoryItem(
                    categoryId,
                    categoryId == null ? "Sem categoria" : (String) row[1],
                    categoryId == null ? "gray" : (String) row[2],
                    categoryId == null ? "other" : (String) row[3],
                    amount,
                    percentage(amount, total),
                    toLong(row[5])));
        }

        items.sort(Comparator.comparingLong(ReportResponseDTO.CategoryItem::totalInCents).reversed()
                .thenComparing(ReportResponseDTO.CategoryItem::name));

        return new ReportResponseDTO.CategoryReport(period.toString(), txType, total, items);
    }

    /* ------------------------------------------------------------------ */
    /* GET /api/reports/monthly                                            */
    /* ------------------------------------------------------------------ */

    @Transactional(readOnly = true)
    public ReportResponseDTO.MonthlyReport getMonthly(UUID userId, int months) {
        int n = validateMonths(months);

        YearMonth last = YearMonth.now();
        YearMonth first = last.minusMonths(n - 1L);

        long[] income = new long[n];
        long[] expense = new long[n];

        List<Object[]> rows = transactionRepository.sumByMonthAndType(
                userId, startOf(first), startOf(last.plusMonths(1)));

        for (Object[] row : rows) {
            int idx = monthIndex(first, ((Number) row[0]).intValue(), ((Number) row[1]).intValue());
            if (idx < 0 || idx >= n) continue;

            if (CREDIT.equals(row[2])) {
                income[idx] += toLong(row[3]);
            } else {
                expense[idx] += toLong(row[3]);
            }
        }

        // Todos os meses da janela entram, mesmo sem movimento (valor 0):
        // o SQL só devolve meses com transação, e o gráfico precisa do eixo completo
        List<ReportResponseDTO.MonthlyItem> items = new ArrayList<>();
        long totalIncome = 0;
        long totalExpense = 0;
        for (int i = 0; i < n; i++) {
            items.add(new ReportResponseDTO.MonthlyItem(
                    first.plusMonths(i).toString(), income[i], expense[i], income[i] - expense[i]));
            totalIncome += income[i];
            totalExpense += expense[i];
        }

        return new ReportResponseDTO.MonthlyReport(n, totalIncome, totalExpense, items);
    }

    /* ------------------------------------------------------------------ */
    /* GET /api/reports/balance-history                                    */
    /* ------------------------------------------------------------------ */

    /**
     * Evolução do saldo ao fim de cada mês (consolidado ou de uma conta).
     *
     * O banco guarda só o saldo ATUAL de cada conta, então a história é reconstruída
     * de trás para frente: saldo ao fim do mês anterior = saldo do mês seguinte
     * menos o efeito das transações do mês seguinte.
     *
     * Limitações (o saldo não guarda histórico próprio):
     *  - Edição manual do saldo da conta (AccountService.update) não gera transação, então
     *    os meses ANTERIORES à edição ficam deslocados pelo valor ajustado.
     *  - Meses anteriores à criação da conta valem 0 naquela conta.
     */
    @Transactional(readOnly = true)
    public ReportResponseDTO.BalanceHistory getBalanceHistory(UUID userId, UUID accountId, int months) {
        int n = validateMonths(months);

        List<Account> accounts;
        if (accountId != null) {
            // findByIdAndUserId garante que a conta é do usuário autenticado
            accounts = List.of(accountRepository.findByIdAndUserId(accountId, userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Conta não encontrada")));
        } else {
            accounts = accountRepository.findAllByUserId(userId);
        }

        YearMonth last = YearMonth.now();
        YearMonth first = last.minusMonths(n - 1L);
        LocalDateTime start = startOf(first);

        // Efeito líquido das transações por conta e por mês (índice 0 = mês mais antigo)
        Map<UUID, long[]> effects = new HashMap<>();
        collectEffects(effects, transactionRepository.sumSourceEffects(userId, start), first, n);
        collectEffects(effects, transactionRepository.sumIncomingTransfers(userId, start), first, n);

        long[] totals = new long[n];
        for (Account account : accounts) {
            long[] ends = reconstructEndBalances(
                    account.getBalanceInCents(),
                    effects.getOrDefault(account.getId(), new long[n]));

            YearMonth createdMonth = YearMonth.from(account.getCreatedAt());
            for (int i = 0; i < n; i++) {
                if (first.plusMonths(i).isBefore(createdMonth)) continue; // conta ainda não existia
                totals[i] += ends[i];
            }
        }

        List<ReportResponseDTO.BalancePoint> points = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            points.add(new ReportResponseDTO.BalancePoint(first.plusMonths(i).toString(), totals[i]));
        }

        return new ReportResponseDTO.BalanceHistory(accountId, n, points);
    }

    /**
     * effects[i] = efeito líquido das transações do mês i (índice 0 = mais antigo;
     * transações com data futura já estão somadas ao último mês).
     * O último ponto é o saldo atual da conta; cada mês anterior desfaz o efeito do seguinte.
     */
    static long[] reconstructEndBalances(long currentBalance, long[] effects) {
        int n = effects.length;
        long[] ends = new long[n];
        ends[n - 1] = currentBalance;
        for (int i = n - 1; i > 0; i--) {
            ends[i - 1] = ends[i] - effects[i];
        }
        return ends;
    }

    // row: [0]=id da conta, [1]=ano, [2]=mês, [3]=efeito no saldo
    private static void collectEffects(Map<UUID, long[]> target, List<Object[]> rows,
                                       YearMonth first, int n) {
        for (Object[] row : rows) {
            UUID accountId = (UUID) row[0];
            int idx = monthIndex(first, ((Number) row[1]).intValue(), ((Number) row[2]).intValue());
            if (idx < 0) continue;

            // Transação com data futura: o saldo atual já a inclui, então conta no mês atual
            idx = Math.min(idx, n - 1);
            target.computeIfAbsent(accountId, k -> new long[n])[idx] += toLong(row[3]);
        }
    }

    /* ------------------------------------------------------------------ */
    /* Utilitários                                                         */
    /* ------------------------------------------------------------------ */

    private static LocalDateTime startOf(YearMonth ym) {
        return ym.atDay(1).atStartOfDay();
    }

    private static int monthIndex(YearMonth first, int year, int month) {
        return (int) ChronoUnit.MONTHS.between(first, YearMonth.of(year, month));
    }

    private static long toLong(Object value) {
        return value == null ? 0L : ((Number) value).longValue();
    }

    private static double percentage(long part, long total) {
        if (total <= 0) return 0.0;
        return Math.round(part * 1000.0 / total) / 10.0;
    }

    private static int validateMonths(int months) {
        if (months < 1 || months > MAX_MONTHS) {
            throw new ValidationException("O parâmetro months deve estar entre 1 e " + MAX_MONTHS);
        }
        return months;
    }

    private static YearMonth parseMonth(String month) {
        if (month == null || month.isBlank()) {
            return YearMonth.now();
        }
        try {
            return YearMonth.parse(month.trim());
        } catch (DateTimeParseException e) {
            throw new ValidationException("Mês inválido. Use o formato YYYY-MM (ex: 2026-11)");
        }
    }

    private static String parseType(String type) {
        if (type == null || type.isBlank()) {
            return DEBIT;
        }
        String normalized = type.trim().toUpperCase(Locale.ROOT);
        if (!DEBIT.equals(normalized) && !CREDIT.equals(normalized)) {
            throw new ValidationException("Tipo inválido. Use DEBIT (despesas) ou CREDIT (receitas)");
        }
        return normalized;
    }
}