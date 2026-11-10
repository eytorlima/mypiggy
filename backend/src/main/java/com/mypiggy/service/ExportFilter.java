package com.mypiggy.service;

import com.mypiggy.exception.ValidationException;
import com.mypiggy.model.Account;
import com.mypiggy.model.Transaction;

import java.util.Collection;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Filtros opcionais da exportação. Conjunto vazio = "sem filtro" (tudo entra).
 * Os três critérios se combinam com E: a transação precisa passar em todos os que estiverem ativos.
 */
public record ExportFilter(Set<String> types, Set<Integer> categoryIds, Set<UUID> accountIds) {

    private static final Set<String> VALID_TYPES = Set.of("CREDIT", "DEBIT", "TRANSFER");

    public ExportFilter {
        types = types == null ? Set.of() : Set.copyOf(types);
        categoryIds = categoryIds == null ? Set.of() : Set.copyOf(categoryIds);
        accountIds = accountIds == null ? Set.of() : Set.copyOf(accountIds);
    }

    public static ExportFilter none() {
        return new ExportFilter(null, null, null);
    }

    /** Monta o filtro a partir dos parâmetros da requisição, validando os tipos. */
    public static ExportFilter of(Collection<String> types, Collection<Integer> categoryIds,
                                  Collection<UUID> accountIds) {
        Set<String> normalized = types == null ? Set.of() : types.stream()
                .map(t -> t.trim().toUpperCase(Locale.ROOT))
                .filter(t -> !t.isEmpty())
                .collect(Collectors.toSet());

        for (String type : normalized) {
            if (!VALID_TYPES.contains(type)) {
                throw new ValidationException(
                        "Tipo inválido: " + type + ". Use CREDIT, DEBIT ou TRANSFER");
            }
        }
        return new ExportFilter(
                normalized,
                categoryIds == null ? null : Set.copyOf(categoryIds),
                accountIds == null ? null : Set.copyOf(accountIds));
    }

    public boolean isEmpty() {
        return types.isEmpty() && categoryIds.isEmpty() && accountIds.isEmpty();
    }

    public boolean matches(Transaction t) {
        if (!types.isEmpty() && !types.contains(t.getTransactionType())) {
            return false;
        }
        // Com filtro de categoria ativo, transação sem categoria (ou transferência, que usa
        // a categoria interna do sistema) não entra
        if (!categoryIds.isEmpty()
                && (t.getCategory() == null || !categoryIds.contains(t.getCategory().getId()))) {
            return false;
        }
        if (!accountIds.isEmpty()) {
            Account destination = t.getDestinationAccount();
            boolean fromSelected = accountIds.contains(t.getAccount().getId());
            boolean toSelected = destination != null && accountIds.contains(destination.getId());
            return fromSelected || toSelected; // transferência aparece se tocar uma conta escolhida
        }
        return true;
    }
}