package com.mypiggy.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Cálculos de saldo, rendimento e progresso de um porquinho. Classe pura (sem Spring/JPA),
 * para ser fácil de testar.
 */
public final class PiggyBankCalculator {

    private static final double DAYS_IN_YEAR = 365.0;

    private PiggyBankCalculator() {
    }

    /** Uma movimentação: positiva = depósito, negativa = retirada. */
    public record Flow(long signedAmountInCents, LocalDate date) {
    }

    /** Valor guardado (soma das movimentações), sem rendimento. */
    public static long principal(List<Flow> flows) {
        long total = 0;
        for (Flow flow : flows) {
            total += flow.signedAmountInCents();
        }
        return total;
    }

    /**
     * Rendimento estimado até hoje, por juros compostos sobre cada movimentação:
     * depósito de X há d dias rendeu X * ((1 + taxa) ^ (d / 365) - 1). A retirada entra com sinal
     * negativo (o que foi retirado deixa de render). Sem taxa, o rendimento é 0.
     *
     * @param annualRatePercent taxa em % ao ano (10.5 = 10,5% a.a.); pode ser nula
     */
    public static long estimatedYield(List<Flow> flows, BigDecimal annualRatePercent, LocalDate today) {
        if (annualRatePercent == null || annualRatePercent.signum() <= 0) {
            return 0;
        }

        double base = 1.0 + annualRatePercent.doubleValue() / 100.0;
        double yield = 0;
        for (Flow flow : flows) {
            // Movimentação com data futura ainda não rendeu nada
            long days = Math.max(0, ChronoUnit.DAYS.between(flow.date(), today));
            yield += flow.signedAmountInCents() * (Math.pow(base, days / DAYS_IN_YEAR) - 1.0);
        }
        return Math.max(0, Math.round(yield));
    }

    /** Percentual da meta já atingido (1 casa decimal, pode passar de 100). Nulo se não há meta. */
    public static Double progressPercent(long totalInCents, Long goalInCents) {
        if (goalInCents == null || goalInCents <= 0) {
            return null;
        }
        double percent = Math.max(0, totalInCents) * 100.0 / goalInCents;
        return Math.round(percent * 10.0) / 10.0;
    }
}