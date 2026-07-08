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

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;
    private final CategoryRepository categoryRepository;

    @Transactional
    public TransactionResponseDTO create(TransactionRequestDTO request, UUID userId) {
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

        // Aplica efeito no saldo
        applyBalanceEffect(account, destinationAccount, request.getTransactionType(),
                request.getAmountInCents());

        accountRepository.save(account);
        if (destinationAccount != null) {
            accountRepository.save(destinationAccount);
        }

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
        return toResponseDTO(saved);
    }

    @Transactional(readOnly = true)
    public List<TransactionResponseDTO> listWithFilters(
            UUID userId, UUID accountId, String type,
            Integer categoryId, LocalDateTime startDate, LocalDateTime endDate) {

        return transactionRepository
                .findWithFilters(userId, accountId, type, categoryId, startDate, endDate)
                .stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public TransactionResponseDTO update(UUID transactionId, TransactionRequestDTO request, UUID userId) {
        Transaction transaction = transactionRepository.findByIdAndUserId(transactionId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Transação não encontrada"));

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
        transaction.setIsRecurring(request.getIsRecurring() != null ? request.getIsRecurring() : false);
        transaction.setRecurrencyType(request.getRecurrencyType());
        transaction.setTags(request.getTags());

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

    @Transactional
    public void delete(UUID transactionId, UUID userId) {
        Transaction transaction = transactionRepository.findByIdAndUserId(transactionId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Transação não encontrada"));

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

    private void validateTransferFields(TransactionRequestDTO request) {
        if ("TRANSFER".equals(request.getTransactionType())
                && request.getDestinationAccountId() == null) {
            throw new ValidationException("Transferência requer conta de destino");
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