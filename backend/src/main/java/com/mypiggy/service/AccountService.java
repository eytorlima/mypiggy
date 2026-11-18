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
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AccountService {

    // Conta padrão criada no cadastro de todo usuário
    private static final String DEFAULT_NAME = "Carteira";
    private static final String DEFAULT_COLOR = "orange";
    private static final String DEFAULT_ICON = "wallet";

    private final AccountRepository accountRepository;
    private final UserRepository userRepository;

    /**
     * Cria a Carteira padrão do usuário (saldo zero). Chamado pelo cadastro, dentro da mesma
     * transação do usuário. Seguro de chamar de novo: se já existe, não faz nada.
     */
    @Transactional
    public void createDefaultFor(User user) {
        if (accountRepository.existsByUserIdAndIsDefaultTrue(user.getId())) {
            return;
        }

        Wallet wallet = new Wallet();
        wallet.setUser(user);
        wallet.setName(DEFAULT_NAME);
        wallet.setBalanceInCents(0L);
        wallet.setColor(DEFAULT_COLOR);
        wallet.setIcon(DEFAULT_ICON);
        wallet.setIsDefault(true);
        accountRepository.save(wallet);
    }

    /** Toda conta criada pelo usuário é uma conta bancária (o tipo enviado é ignorado). */
    @Transactional
    public AccountResponseDTO create(AccountRequestDTO request, UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));

        String name = request.getName().trim();
        if (DEFAULT_NAME.equalsIgnoreCase(name)) {
            throw new ValidationException("O nome \"Carteira\" é reservado para a conta padrão");
        }

        BankAccount account = new BankAccount();
        account.setAgency(request.getAgency());
        account.setAccountNumber(request.getAccountNumber());
        account.setBranchNumber(request.getBranchNumber());

        account.setUser(user);
        account.setName(name);
        account.setBalanceInCents(request.getBalanceInCents() != null ? request.getBalanceInCents() : 0L);
        account.setColor(request.getColor());
        account.setIcon(request.getIcon());
        account.setIsDefault(false);

        Account saved = accountRepository.save(account);
        return toResponseDTO(saved);
    }

    @Transactional(readOnly = true)
    public List<AccountResponseDTO> listByUser(UUID userId) {
        return accountRepository.findAllByUserId(userId)
                .stream()
                // Carteira (padrão) primeiro; as demais em ordem alfabética
                .sorted(Comparator
                        .comparing((Account a) -> !Boolean.TRUE.equals(a.getIsDefault()))
                        .thenComparing(Account::getName, String.CASE_INSENSITIVE_ORDER))
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AccountResponseDTO getById(UUID accountId, UUID userId) {
        Account account = accountRepository.findByIdAndUserId(accountId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Conta não encontrada"));
        return toResponseDTO(account);
    }

    @Transactional
    public AccountResponseDTO update(UUID accountId, AccountRequestDTO request, UUID userId) {
        Account account = accountRepository.findByIdAndUserId(accountId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Conta não encontrada"));

        // O tipo da conta (discriminador SINGLE_TABLE) não pode ser alterado aqui.
        if (Boolean.TRUE.equals(account.getIsDefault())) {
            // Carteira: o nome é fixo (o que vier no request é ignorado) e o saldo nunca fica negativo
            if (request.getBalanceInCents() != null && request.getBalanceInCents() < 0) {
                throw new ValidationException("A Carteira não pode ficar com saldo negativo");
            }
        } else {
            String name = request.getName().trim();
            // Só valida se o nome mudou, para não bloquear quem já tinha uma conta com esse nome
            if (!name.equalsIgnoreCase(account.getName()) && DEFAULT_NAME.equalsIgnoreCase(name)) {
                throw new ValidationException("O nome \"Carteira\" é reservado para a conta padrão");
            }
            account.setName(name);
        }

        if (request.getBalanceInCents() != null) {
            account.setBalanceInCents(request.getBalanceInCents());
        }
        if (request.getColor() != null) {
            account.setColor(request.getColor());
        }
        if (request.getIcon() != null) {
            account.setIcon(request.getIcon());
        }

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

    @Transactional
    public void delete(UUID accountId, UUID userId) {
        Account account = accountRepository.findByIdAndUserId(accountId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Conta não encontrada"));

        if (Boolean.TRUE.equals(account.getIsDefault())) {
            throw new ValidationException("A Carteira é uma conta padrão e não pode ser excluída");
        }

        accountRepository.delete(account);
    }

    @Transactional(readOnly = true)
    public Long getSummary(UUID userId) {
        Long total = accountRepository.sumBalanceByUserId(userId);
        return total != null ? total : 0L;
    }

    // Converte Account → AccountResponseDTO
    private AccountResponseDTO toResponseDTO(Account account) {
        AccountResponseDTO dto = new AccountResponseDTO();
        dto.setId(account.getId());
        dto.setName(account.getName());
        dto.setAccountType(account.getClass().getAnnotation(
            jakarta.persistence.DiscriminatorValue.class).value());
        dto.setBalanceInCents(account.getBalanceInCents());
        dto.setColor(account.getColor());
        dto.setIcon(account.getIcon());
        dto.setIsDefault(Boolean.TRUE.equals(account.getIsDefault()));
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