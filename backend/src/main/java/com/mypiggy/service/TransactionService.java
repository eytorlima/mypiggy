package com.mypiggy.service;

import com.mypiggy.dto.TransactionRequestDTO;
import com.mypiggy.dto.TransactionResponseDTO;
import com.mypiggy.exception.ResourceNotFoundException;
import com.mypiggy.exception.ValidationException;
import com.mypiggy.model.Account;
import com.mypiggy.model.Category;
import com.mypiggy.model.Transaction;
import com.mypiggy.repository.AccountRepository;
import com.mypiggy.repository.CategoryRepository;
import com.mypiggy.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TransactionService {

    // Teto de segurança para as ocorrências atrasadas geradas de uma só vez
    private static final int MAX_BACKFILL_OCCURRENCES = 366;

    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;
    private final CategoryRepository categoryRepository;

    @Transactional
    public TransactionResponseDTO create(TransactionRequestDTO request, UUID userId) {
        rejectPiggyType(request.getTransactionType());

        Account account = accountRepository.findByIdAndUserId(request.getAccountId(), userId)
                .orElseThrow(() -> new ResourceNotFoundException("Conta não encontrada"));

        validateTransferFields(request);

        Account destinationAccount = null;
        if ("TRANSFER".equals(request.getTransactionType())) {
            destinationAccount = accountRepository
                    .findByIdAndUserId(request.getDestinationAccountId(), userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Conta de destino não encontrada"));

            if (account.getId().equals(destinationAccount.getId())) {
                throw new ValidationException("Conta de origem e destino não podem ser iguais");
            }
        }

        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Categoria não encontrada"));
        }

        boolean recurring = isRecurringRequest(request);
        if (recurring) {
            validateRecurrence(request);
        }

        // Aplica o efeito da transação original no saldo
        applyBalanceEffect(account, destinationAccount, request.getTransactionType(),
                request.getAmountInCents());

        Transaction transaction = new Transaction();
        transaction.setAccount(account);
        transaction.setDestinationAccount(destinationAccount);
        transaction.setCategory(category);
        transaction.setAmountInCents(request.getAmountInCents());
        transaction.setDescription(request.getDescription());
        transaction.setTransactionDate(request.getTransactionDate());
        transaction.setTransactionType(request.getTransactionType());
        transaction.setIsRecurring(request.getIsRecurring() != null ? request.getIsRecurring() : false);
        transaction.setRecurrencyType(request.getRecurrencyType());
        transaction.setTags(request.getTags());

        Transaction saved = transactionRepository.save(transaction);

        // Recorrente com data no passado: registra as ocorrências que já deveriam ter acontecido
        if (recurring) {
            generateMissedOccurrences(saved, account);
        }

        // Contas salvas por último: o saldo já inclui a original e as ocorrências geradas
        accountRepository.save(account);
        if (destinationAccount != null) {
            accountRepository.save(destinationAccount);
        }

        return toResponseDTO(saved);
    }

    // Mantido para quem chama sem pesquisa
    @Transactional(readOnly = true)
    public List<TransactionResponseDTO> listWithFilters(
            UUID userId, UUID accountId, String type,
            Integer categoryId, LocalDateTime startDate, LocalDateTime endDate) {

        return listWithFilters(userId, accountId, type, categoryId, startDate, endDate, null);
    }

    @Transactional(readOnly = true)
    public List<TransactionResponseDTO> listWithFilters(
            UUID userId, UUID accountId, String type,
            Integer categoryId, LocalDateTime startDate, LocalDateTime endDate,
            String search) {

        return transactionRepository
                .findWithFilters(userId, accountId, type, categoryId, startDate, endDate,
                        toLikePattern(search))
                .stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public TransactionResponseDTO update(UUID transactionId, TransactionRequestDTO request, UUID userId) {
        Transaction transaction = transactionRepository.findByIdAndUserId(transactionId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Transação não encontrada"));

        rejectPiggyTransaction(transaction);
        rejectPiggyType(request.getTransactionType());

        // Reverte o efeito anterior no saldo
        revertBalanceEffect(
                transaction.getAccount(),
                transaction.getDestinationAccount(),
                transaction.getTransactionType(),
                transaction.getAmountInCents()
        );
        accountRepository.save(transaction.getAccount());
        if (transaction.getDestinationAccount() != null) {
            accountRepository.save(transaction.getDestinationAccount());
        }

        // Busca nova conta e aplica novo efeito
        Account newAccount = accountRepository.findByIdAndUserId(request.getAccountId(), userId)
                .orElseThrow(() -> new ResourceNotFoundException("Conta não encontrada"));

        Account newDestination = null;
        if ("TRANSFER".equals(request.getTransactionType())) {
            newDestination = accountRepository
                    .findByIdAndUserId(request.getDestinationAccountId(), userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Conta de destino não encontrada"));
        }

        applyBalanceEffect(newAccount, newDestination, request.getTransactionType(),
                request.getAmountInCents());
        accountRepository.save(newAccount);
        if (newDestination != null) {
            accountRepository.save(newDestination);
        }

        // Atualiza os campos da transação
        transaction.setAccount(newAccount);
        transaction.setDestinationAccount(newDestination);
        transaction.setAmountInCents(request.getAmountInCents());
        transaction.setDescription(request.getDescription());
        transaction.setTransactionDate(request.getTransactionDate());
        transaction.setTransactionType(request.getTransactionType());
        transaction.setTags(request.getTags());

        // Quem faz parte de uma série não muda a recorrência pela edição:
        // isso só acontece por "Encerrar recorrência" (evita quebrar a série sem querer)
        if (!isSeriesMember(transaction)) {
            transaction.setIsRecurring(request.getIsRecurring() != null ? request.getIsRecurring() : false);
            transaction.setRecurrencyType(request.getRecurrencyType());
        }

        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Categoria não encontrada"));
            transaction.setCategory(category);
        } else {
            transaction.setCategory(null);
        }

        Transaction updated = transactionRepository.save(transaction);
        return toResponseDTO(updated);
    }

    // Mantido para quem chama sem escopo (exclui só a transação)
    @Transactional
    public void delete(UUID transactionId, UUID userId) {
        delete(transactionId, userId, "ONE");
    }

    /**
     * @param scope "ONE" = só esta transação | "SERIES" = a série inteira (todas as ocorrências)
     */
    @Transactional
    public void delete(UUID transactionId, UUID userId, String scope) {
        Transaction transaction = transactionRepository.findByIdAndUserId(transactionId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Transação não encontrada"));

        rejectPiggyTransaction(transaction);

        boolean wholeSeries = "SERIES".equalsIgnoreCase(scope);
        if (scope != null && !wholeSeries && !"ONE".equalsIgnoreCase(scope)) {
            throw new ValidationException("Escopo inválido. Use ONE ou SERIES");
        }

        if (wholeSeries) {
            deleteSeries(transaction);
            return;
        }

        // Excluir só a original não pode deixar as demais órfãs: a mais antiga assume
        promoteNextAsRoot(transaction);

        // Reverte o efeito no saldo antes de deletar
        revertBalanceEffect(
                transaction.getAccount(),
                transaction.getDestinationAccount(),
                transaction.getTransactionType(),
                transaction.getAmountInCents()
        );
        accountRepository.save(transaction.getAccount());
        if (transaction.getDestinationAccount() != null) {
            accountRepository.save(transaction.getDestinationAccount());
        }

        transactionRepository.delete(transaction);
    }

    /**
     * Encerra a recorrência: nada é apagado, mas a série deixa de gerar novas transações.
     * Pode ser chamado a partir de qualquer transação da série (original ou gerada).
     */
    @Transactional
    public TransactionResponseDTO deactivateRecurrence(UUID transactionId, UUID userId) {
        Transaction transaction = transactionRepository.findByIdAndUserId(transactionId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Transação não encontrada"));

        Transaction root = rootOf(transaction);
        if (root.getRecurrencyType() == null) {
            throw new ValidationException("Esta transação não faz parte de uma recorrência");
        }

        root.setIsRecurring(false);
        transactionRepository.save(root);

        return toResponseDTO(transaction);
    }

    @Transactional(readOnly = true)
    public Map<String, Long> getMonthlySummary(UUID userId, int month, int year) {
        LocalDateTime startDate = LocalDateTime.of(year, month, 1, 0, 0, 0);
        LocalDateTime endDate = startDate.plusMonths(1).minusSeconds(1);

        List<Object[]> results = transactionRepository.getMonthlySummary(userId, startDate, endDate);

        Map<String, Long> summary = new HashMap<>();
        summary.put("CREDIT", 0L);
        summary.put("DEBIT", 0L);

        for (Object[] row : results) {
            summary.put((String) row[0], (Long) row[1]);
        }

        return summary;
    }

    /* ------------------------------------------------------------------ */
    /* Pesquisa                                                            */
    /* ------------------------------------------------------------------ */

    // "Mercado" -> "%mercado%". Escapa % e _ digitados pelo usuário para não virarem curinga.
    private String toLikePattern(String search) {
        if (search == null || search.isBlank()) {
            return null;
        }
        String escaped = search.trim().toLowerCase(Locale.ROOT)
                .replace("\\", "\\\\")
                .replace("%", "\\%")
                .replace("_", "\\_");
        return "%" + escaped + "%";
    }

    /* ------------------------------------------------------------------ */
    /* Recorrência                                                         */
    /* ------------------------------------------------------------------ */

    // Recorrência só vale para receita/despesa (transferência não é recorrente)
    private boolean isRecurringRequest(TransactionRequestDTO request) {
        return Boolean.TRUE.equals(request.getIsRecurring())
                && request.getRecurrencyType() != null
                && !"TRANSFER".equals(request.getTransactionType());
    }

    // Recorrência diária só pode começar até 1 mês atrás (evita dezenas de lançamentos de uma vez)
    private void validateRecurrence(TransactionRequestDTO request) {
        if ("DAILY".equals(request.getRecurrencyType())
                && request.getTransactionDate().toLocalDate().isBefore(LocalDate.now().minusMonths(1))) {
            throw new ValidationException("Recorrência diária pode começar no máximo 1 mês atrás");
        }
    }

    // Raiz da série: a própria transação (original) ou o pai das cópias
    private Transaction rootOf(Transaction t) {
        return t.getRecurrenceParent() != null ? t.getRecurrenceParent() : t;
    }

    // Faz parte de uma série (ativa ou encerrada) se tem pai ou guarda o tipo de recorrência
    private boolean isSeriesMember(Transaction t) {
        return t.getRecurrenceParent() != null || t.getRecurrencyType() != null;
    }

    // Cria uma cópia para cada ocorrência entre a data original (exclusive) e hoje (inclusive)
    private void generateMissedOccurrences(Transaction original, Account account) {
        LocalDate today = LocalDate.now();
        List<Transaction> copies = new ArrayList<>();

        for (int step = 1; ; step++) {
            // Sempre calculado a partir da data ORIGINAL (31/01 + 1 mês = 28/02, + 2 meses = 31/03)
            LocalDateTime next = nextOccurrence(
                    original.getTransactionDate(), original.getRecurrencyType(), step);

            if (next.toLocalDate().isAfter(today)) break; // futuras: ficam para a automação (Sprint 5)

            if (step > MAX_BACKFILL_OCCURRENCES) {
                throw new ValidationException("Data muito antiga: a recorrência geraria mais de "
                        + MAX_BACKFILL_OCCURRENCES + " transações");
            }

            Transaction copy = new Transaction();
            copy.setAccount(account);
            copy.setCategory(original.getCategory());
            copy.setAmountInCents(original.getAmountInCents());
            copy.setDescription(original.getDescription());
            copy.setTransactionDate(next);
            copy.setTransactionType(original.getTransactionType());
            copy.setIsRecurring(false); // só a raiz da série guarda se está ativa
            copy.setRecurrencyType(null); // o tipo é herdado da raiz
            copy.setTags(original.getTags());
            copy.setRecurrenceParent(original);

            applyBalanceEffect(account, null, copy.getTransactionType(), copy.getAmountInCents());
            copies.add(copy);
        }

        transactionRepository.saveAll(copies);
    }

    private LocalDateTime nextOccurrence(LocalDateTime start, String recurrency, int step) {
        return switch (recurrency) {
            case "DAILY" -> start.plusDays(step);
            case "WEEKLY" -> start.plusWeeks(step);
            case "MONTHLY" -> start.plusMonths(step);
            case "ANNUAL" -> start.plusYears(step);
            default -> throw new ValidationException("Tipo de recorrência inválido");
        };
    }

    // Exclui a série inteira, devolvendo o efeito de CADA ocorrência ao saldo da sua conta
    private void deleteSeries(Transaction transaction) {
        Transaction root = rootOf(transaction);

        List<Transaction> series = new ArrayList<>();
        series.add(root);
        series.addAll(transactionRepository.findByRecurrenceParentOrderByTransactionDateAsc(root));

        for (Transaction t : series) {
            revertBalanceEffect(
                    t.getAccount(),
                    t.getDestinationAccount(),
                    t.getTransactionType(),
                    t.getAmountInCents()
            );
            accountRepository.save(t.getAccount());
            if (t.getDestinationAccount() != null) {
                accountRepository.save(t.getDestinationAccount());
            }
        }

        transactionRepository.deleteAll(series);
    }

    // Se a transação é a raiz de uma série, a ocorrência mais antiga vira a nova raiz
    // (herda o tipo e se está ativa) e as demais passam a apontar para ela
    private void promoteNextAsRoot(Transaction removed) {
        List<Transaction> children =
                transactionRepository.findByRecurrenceParentOrderByTransactionDateAsc(removed);
        if (children.isEmpty()) {
            return;
        }

        Transaction newRoot = children.get(0);
        newRoot.setIsRecurring(removed.getIsRecurring());
        newRoot.setRecurrencyType(removed.getRecurrencyType());
        newRoot.setRecurrenceParent(null);

        for (int i = 1; i < children.size(); i++) {
            children.get(i).setRecurrenceParent(newRoot);
        }

        transactionRepository.saveAll(children);
        transactionRepository.flush(); // garante que os filhos saiam da raiz antes do delete
    }

    /* ------------------------------------------------------------------ */
    /* Saldo                                                               */
    /* ------------------------------------------------------------------ */

    // Aplica o efeito da transação nos saldos
    private void applyBalanceEffect(Account account, Account destination,
                                     String type, Long amount) {
        switch (type) {
            case "CREDIT" -> account.setBalanceInCents(account.getBalanceInCents() + amount);
            case "DEBIT"  -> account.setBalanceInCents(account.getBalanceInCents() - amount);
            case "TRANSFER" -> {
                account.setBalanceInCents(account.getBalanceInCents() - amount);
                destination.setBalanceInCents(destination.getBalanceInCents() + amount);
            }
        }
    }

    // Reverte o efeito (inverso do apply)
    private void revertBalanceEffect(Account account, Account destination,
                                      String type, Long amount) {
        switch (type) {
            case "CREDIT" -> account.setBalanceInCents(account.getBalanceInCents() - amount);
            case "DEBIT"  -> account.setBalanceInCents(account.getBalanceInCents() + amount);
            case "TRANSFER" -> {
                account.setBalanceInCents(account.getBalanceInCents() + amount);
                destination.setBalanceInCents(destination.getBalanceInCents() - amount);
            }
        }
    }

    /* ------------------------------------------------------------------ */
    /* Validações                                                          */
    /* ------------------------------------------------------------------ */

    private void validateTransferFields(TransactionRequestDTO request) {
        if ("TRANSFER".equals(request.getTransactionType())
                && request.getDestinationAccountId() == null) {
            throw new ValidationException("Transferência requer conta de destino");
        }
    }

    // Transações PIGGY_* nascem só nas movimentações do porquinho
    private void rejectPiggyType(String type) {
        if (type != null && type.startsWith("PIGGY_")) {
            throw new ValidationException("Use a tela de Metas para guardar ou retirar dinheiro de um porquinho");
        }
    }

    private void rejectPiggyTransaction(Transaction transaction) {
        if (transaction.getTransactionType().startsWith("PIGGY_")) {
            throw new ValidationException("Esta transação foi gerada por um porquinho e não pode ser alterada ou excluída aqui");
        }
    }

    private TransactionResponseDTO toResponseDTO(Transaction t) {
        TransactionResponseDTO dto = new TransactionResponseDTO();
        dto.setId(t.getId());
        dto.setAccountId(t.getAccount().getId());
        dto.setAccountName(t.getAccount().getName());
        dto.setAmountInCents(t.getAmountInCents());
        dto.setDescription(t.getDescription());
        dto.setTransactionDate(t.getTransactionDate());
        dto.setTransactionType(t.getTransactionType());
        dto.setIsRecurring(t.getIsRecurring());
        dto.setRecurrencyType(t.getRecurrencyType());
        dto.setTags(t.getTags());
        dto.setCreatedAt(t.getCreatedAt());

        // Série de recorrência: todas as transações dela (original ou geradas) mostram o mesmo
        // tipo e o mesmo estado (ativa/encerrada), lidos da raiz
        Transaction root = rootOf(t);
        if (root.getRecurrencyType() != null) {
            dto.setRecurrencyType(root.getRecurrencyType());
            dto.setRecurrenceSeriesId(root.getId());
            dto.setRecurrenceActive(Boolean.TRUE.equals(root.getIsRecurring()));
        }

        if (t.getDestinationAccount() != null) {
            dto.setDestinationAccountId(t.getDestinationAccount().getId());
            dto.setDestinationAccountName(t.getDestinationAccount().getName());
        }

        if (t.getCategory() != null) {
            dto.setCategoryId(t.getCategory().getId());
            dto.setCategoryName(t.getCategory().getName());
            dto.setCategoryColor(t.getCategory().getColor());
            dto.setCategoryIcon(t.getCategory().getIcon());
        }

        return dto;
    }
}