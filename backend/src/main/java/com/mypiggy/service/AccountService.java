package com.mypiggy.service;

import com.mypiggy.dto.AccountRequestDTO;
import com.mypiggy.dto.AccountResponseDTO;
import com.mypiggy.exception.ResourceNotFoundException;
import com.mypiggy.exception.ValidationException;
import com.mypiggy.model.*;
import com.mypiggy.repository.AccountRepository;
import com.mypiggy.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AccountService {

    private final AccountRepository accountRepository;
    private final UserRepository userRepository;

    public AccountResponseDTO create(AccountRequestDTO request, UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));

        Account account = buildAccount(request);
        account.setUser(user);
        account.setName(request.getName());
        account.setBalanceInCents(request.getBalanceInCents() != null ? request.getBalanceInCents() : 0L);

        Account saved = accountRepository.save(account);
        return toResponseDTO(saved);
    }

    public List<AccountResponseDTO> listByUser(UUID userId) {
        return accountRepository.findAllByUserId(userId)
                .stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }

    public AccountResponseDTO getById(UUID accountId, UUID userId) {
        Account account = accountRepository.findByIdAndUserId(accountId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Conta não encontrada"));
        return toResponseDTO(account);
    }

    public AccountResponseDTO update(UUID accountId, AccountRequestDTO request, UUID userId) {
        Account account = accountRepository.findByIdAndUserId(accountId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Conta não encontrada"));

        account.setName(request.getName());

        // Atualiza campos específicos se aplicável
        if (account instanceof BankAccount ba) {
            ba.setAgency(request.getAgency());
            ba.setAccountNumber(request.getAccountNumber());
            ba.setBranchNumber(request.getBranchNumber());
        } else if (account instanceof CheckingAccount ca) {
            ca.setCreditLimitInCents(request.getCreditLimitInCents());
        } else if (account instanceof SavingsAccount sa) {
            sa.setWithdrawalLimitInCents(request.getWithdrawalLimitInCents());
        }

        Account updated = accountRepository.save(account);
        return toResponseDTO(updated);
    }

    public void delete(UUID accountId, UUID userId) {
        Account account = accountRepository.findByIdAndUserId(accountId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Conta não encontrada"));
        accountRepository.delete(account);
    }

    public Long getSummary(UUID userId) {
        return accountRepository.sumBalanceByUserId(userId);
    }

    // Monta a subclasse correta com base no accountType
    private Account buildAccount(AccountRequestDTO request) {
        return switch (request.getAccountType()) {
            case "BANK_ACCOUNT" -> {
                BankAccount ba = new BankAccount();
                ba.setAgency(request.getAgency());
                ba.setAccountNumber(request.getAccountNumber());
                ba.setBranchNumber(request.getBranchNumber());
                yield ba;
            }
            case "CHECKING_ACCOUNT" -> {
                CheckingAccount ca = new CheckingAccount();
                ca.setCreditLimitInCents(request.getCreditLimitInCents());
                yield ca;
            }
            case "SAVINGS_ACCOUNT" -> {
                SavingsAccount sa = new SavingsAccount();
                sa.setWithdrawalLimitInCents(request.getWithdrawalLimitInCents());
                yield sa;
            }
            case "WALLET" -> new Wallet();
            default -> throw new ValidationException("Tipo de conta inválido: " + request.getAccountType());
        };
    }

    // Converte Account → AccountResponseDTO
    private AccountResponseDTO toResponseDTO(Account account) {
        AccountResponseDTO dto = new AccountResponseDTO();
        dto.setId(account.getId());
        dto.setName(account.getName());
        dto.setAccountType(account.getClass().getAnnotation(
            jakarta.persistence.DiscriminatorValue.class).value());
        dto.setBalanceInCents(account.getBalanceInCents());
        dto.setCreatedAt(account.getCreatedAt());
        dto.setUpdatedAt(account.getUpdatedAt());

        if (account instanceof BankAccount ba) {
            dto.setAgency(ba.getAgency());
            dto.setAccountNumber(ba.getAccountNumber());
            dto.setBranchNumber(ba.getBranchNumber());
        } else if (account instanceof CheckingAccount ca) {
            dto.setCreditLimitInCents(ca.getCreditLimitInCents());
        } else if (account instanceof SavingsAccount sa) {
            dto.setWithdrawalLimitInCents(sa.getWithdrawalLimitInCents());
        }

        return dto;
    }
}