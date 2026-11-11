package com.mypiggy.service;

import com.mypiggy.dto.PiggyBankMovementRequestDTO;
import com.mypiggy.dto.PiggyBankMovementResponseDTO;
import com.mypiggy.dto.PiggyBankRequestDTO;
import com.mypiggy.dto.PiggyBankResponseDTO;
import com.mypiggy.exception.ResourceNotFoundException;
import com.mypiggy.exception.ValidationException;
import com.mypiggy.model.Account;
import com.mypiggy.model.CheckingAccount;
import com.mypiggy.model.PiggyBank;
import com.mypiggy.model.PiggyBankMovement;
import com.mypiggy.model.Transaction;
import com.mypiggy.model.User;
import com.mypiggy.repository.AccountRepository;
import com.mypiggy.repository.PiggyBankMovementRepository;
import com.mypiggy.repository.PiggyBankRepository;
import com.mypiggy.repository.TransactionRepository;
import com.mypiggy.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PiggyBankService {

    // Mesmos textos da migration V12 (que criou a reserva dos usuários já existentes)
    public static final String EMERGENCY_NAME = "Reserva de emergência";
    public static final String EMERGENCY_DESCRIPTION = "Valor guardado para imprevistos";

    private static final String DEPOSIT = "DEPOSIT";
    private static final String WITHDRAWAL = "WITHDRAWAL";
    private static final String TX_DEPOSIT = "PIGGY_DEPOSIT";
    private static final String TX_WITHDRAWAL = "PIGGY_WITHDRAWAL";

    private final PiggyBankRepository piggyBankRepository;
    private final PiggyBankMovementRepository movementRepository;
    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;

    /* ------------------------------------------------------------------ */
    /* CRUD                                                                */
    /* ------------------------------------------------------------------ */

    @Transactional(readOnly = true)
    public List<PiggyBankResponseDTO> listByUser(UUID userId) {
        List<PiggyBank> piggyBanks = piggyBankRepository.findAllByUserId(userId);

        // Uma consulta só para as movimentações de todos os porquinhos (evita N+1)
        Map<UUID, List<PiggyBankMovement>> byPiggy = new HashMap<>();
        for (PiggyBankMovement m : movementRepository.findAllByUserId(userId)) {
            byPiggy.computeIfAbsent(m.getPiggyBank().getId(), k -> new ArrayList<>()).add(m);
        }

        LocalDate today = LocalDate.now();
        return piggyBanks.stream()
                // Reserva de emergência primeiro; depois, por ordem de criação
                .sorted(Comparator
                        .comparing((PiggyBank p) -> !Boolean.TRUE.equals(p.getIsEmergency()))
                        .thenComparing(PiggyBank::getCreatedAt))
                .map(p -> toResponseDTO(p, byPiggy.getOrDefault(p.getId(), List.of()), today))
                .toList();
    }

    @Transactional(readOnly = true)
    public PiggyBankResponseDTO getById(UUID id, UUID userId) {
        PiggyBank piggyBank = findOwned(id, userId);
        return toResponseDTO(piggyBank, movementRepository.findAllByPiggyBankId(id), LocalDate.now());
    }

    @Transactional
    public PiggyBankResponseDTO create(PiggyBankRequestDTO request, UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));

        validate(request, null);

        PiggyBank piggyBank = new PiggyBank();
        piggyBank.setUser(user);
        piggyBank.setIsEmergency(false);
        applyFields(piggyBank, request);

        PiggyBank saved = piggyBankRepository.save(piggyBank);
        return toResponseDTO(saved, List.of(), LocalDate.now());
    }

    @Transactional
    public PiggyBankResponseDTO update(UUID id, PiggyBankRequestDTO request, UUID userId) {
        PiggyBank piggyBank = findOwned(id, userId);

        validate(request, piggyBank);
        applyFields(piggyBank, request);

        PiggyBank saved = piggyBankRepository.save(piggyBank);
        return toResponseDTO(saved, movementRepository.findAllByPiggyBankId(id), LocalDate.now());
    }

    /**
     * Exclui o porquinho. Se ainda houver dinheiro guardado, ele é devolvido à conta
     * returnAccountId (uma retirada automática) antes de excluir: nenhum dinheiro some.
     */
    @Transactional
    public void delete(UUID id, UUID returnAccountId, UUID userId) {
        PiggyBank piggyBank = findOwned(id, userId);

        if (Boolean.TRUE.equals(piggyBank.getIsEmergency())) {
            throw new ValidationException("A reserva de emergência não pode ser excluída");
        }

        long balance = PiggyBankCalculator.principal(flowsOf(movementRepository.findAllByPiggyBankId(id)));
        if (balance > 0) {
            if (returnAccountId == null) {
                throw new ValidationException(
                        "Este porquinho tem dinheiro guardado. Informe a conta que receberá o valor (returnAccountId)");
            }
            Account account = findAccount(returnAccountId, userId);
            moveToAccount(piggyBank, account, balance);
        }

        // As movimentações saem junto; as transações no extrato permanecem como histórico
        movementRepository.deleteAllByPiggyBankId(id);
        piggyBankRepository.delete(piggyBank);
    }

    /** Chamado no cadastro do usuário (AuthService): cria a Reserva de emergência. */
    @Transactional
    public void createEmergencyFor(User user) {
        PiggyBank piggyBank = new PiggyBank();
        piggyBank.setUser(user);
        piggyBank.setName(EMERGENCY_NAME);
        piggyBank.setDescription(EMERGENCY_DESCRIPTION);
        piggyBank.setIsEmergency(true);
        piggyBankRepository.save(piggyBank);
    }

    /* ------------------------------------------------------------------ */
    /* Depósito / retirada                                                 */
    /* ------------------------------------------------------------------ */

    @Transactional
    public PiggyBankResponseDTO deposit(UUID id, PiggyBankMovementRequestDTO request, UUID userId) {
        PiggyBank piggyBank = findOwned(id, userId);
        Account account = findAccount(request.getAccountId(), userId);
        long amount = request.getAmountInCents();

        if (availableIn(account) < amount) {
            throw new ValidationException("Saldo insuficiente na conta " + account.getName());
        }

        // O dinheiro SAI da conta...
        account.setBalanceInCents(account.getBalanceInCents() - amount);
        accountRepository.save(account);

        // ...e entra no extrato como transação neutra (não é despesa nos relatórios)
        Transaction transaction = saveNeutralTransaction(
                account, TX_DEPOSIT, amount, "Guardado em " + piggyBank.getName());
        saveMovement(piggyBank, account, transaction, DEPOSIT, amount);

        return toResponseDTO(piggyBank, movementRepository.findAllByPiggyBankId(id), LocalDate.now());
    }

    @Transactional
    public PiggyBankResponseDTO withdraw(UUID id, PiggyBankMovementRequestDTO request, UUID userId) {
        PiggyBank piggyBank = findOwned(id, userId);
        Account account = findAccount(request.getAccountId(), userId);
        long amount = request.getAmountInCents();

        long balance = PiggyBankCalculator.principal(flowsOf(movementRepository.findAllByPiggyBankId(id)));
        if (amount > balance) {
            throw new ValidationException("O valor é maior que o saldo guardado no porquinho");
        }

        moveToAccount(piggyBank, account, amount);

        return toResponseDTO(piggyBank, movementRepository.findAllByPiggyBankId(id), LocalDate.now());
    }

    @Transactional(readOnly = true)
    public List<PiggyBankMovementResponseDTO> listMovements(UUID id, UUID userId) {
        findOwned(id, userId); // garante que o porquinho é do usuário
        return movementRepository.findAllByPiggyBankId(id).stream()
                .map(this::toMovementDTO)
                .toList();
    }

    /* ------------------------------------------------------------------ */
    /* Auxiliares                                                          */
    /* ------------------------------------------------------------------ */

    private PiggyBank findOwned(UUID id, UUID userId) {
        return piggyBankRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Porquinho não encontrado"));
    }

    private Account findAccount(UUID accountId, UUID userId) {
        return accountRepository.findByIdAndUserId(accountId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Conta não encontrada"));
    }

    // Quanto a conta pode gastar: saldo + limite do cheque especial (conta corrente)
    private static long availableIn(Account account) {
        long available = account.getBalanceInCents();
        if (account instanceof CheckingAccount checking && checking.getCreditLimitInCents() != null) {
            available += checking.getCreditLimitInCents();
        }
        return available;
    }

    // Retirada: o dinheiro VOLTA para a conta, com transação neutra no extrato
    private void moveToAccount(PiggyBank piggyBank, Account account, long amount) {
        account.setBalanceInCents(account.getBalanceInCents() + amount);
        accountRepository.save(account);

        Transaction transaction = saveNeutralTransaction(
                account, TX_WITHDRAWAL, amount, "Retirada de " + piggyBank.getName());
        saveMovement(piggyBank, account, transaction, WITHDRAWAL, amount);
    }

    private Transaction saveNeutralTransaction(Account account, String type, long amount, String description) {
        Transaction transaction = new Transaction();
        transaction.setAccount(account);
        transaction.setAmountInCents(amount);
        transaction.setDescription(description);
        transaction.setTransactionDate(LocalDateTime.now());
        transaction.setTransactionType(type);
        transaction.setIsRecurring(false);
        return transactionRepository.save(transaction);
    }

    private void saveMovement(PiggyBank piggyBank, Account account, Transaction transaction,
                              String type, long amount) {
        PiggyBankMovement movement = new PiggyBankMovement();
        movement.setPiggyBank(piggyBank);
        movement.setAccount(account);
        movement.setTransaction(transaction);
        movement.setMovementType(type);
        movement.setAmountInCents(amount);
        movement.setMovementDate(transaction.getTransactionDate());
        movementRepository.save(movement);
    }

    // existing == null na criação
    private void validate(PiggyBankRequestDTO request, PiggyBank existing) {
        String name = request.getName().trim();
        boolean emergency = existing != null && Boolean.TRUE.equals(existing.getIsEmergency());

        if (emergency) {
            if (!existing.getName().equals(name)) {
                throw new ValidationException("O nome da reserva de emergência não pode ser alterado");
            }
        } else if (EMERGENCY_NAME.equalsIgnoreCase(name)) {
            throw new ValidationException("Este nome é reservado pelo sistema");
        }

        if (request.getTargetDate() != null && request.getGoalInCents() == null) {
            throw new ValidationException("Para definir um prazo, informe também o valor da meta");
        }

        // Só barra prazo no passado quando a data é nova: editar outros campos de uma meta
        // antiga (com prazo já vencido) continua possível
        boolean dateChanged = existing == null
                || !java.util.Objects.equals(request.getTargetDate(), existing.getTargetDate());
        if (request.getTargetDate() != null && dateChanged
                && request.getTargetDate().isBefore(LocalDate.now())) {
            throw new ValidationException("O prazo da meta não pode estar no passado");
        }
    }

    private void applyFields(PiggyBank piggyBank, PiggyBankRequestDTO request) {
        piggyBank.setName(request.getName().trim());
        piggyBank.setDescription(request.getDescription());
        piggyBank.setIcon(request.getIcon());
        piggyBank.setColor(request.getColor());
        piggyBank.setGoalInCents(request.getGoalInCents());
        piggyBank.setTargetDate(request.getTargetDate());
        piggyBank.setAnnualRate(request.getAnnualRate());
    }

    private static List<PiggyBankCalculator.Flow> flowsOf(List<PiggyBankMovement> movements) {
        return movements.stream()
                .map(m -> new PiggyBankCalculator.Flow(
                        DEPOSIT.equals(m.getMovementType()) ? m.getAmountInCents() : -m.getAmountInCents(),
                        m.getMovementDate().toLocalDate()))
                .toList();
    }

    private PiggyBankResponseDTO toResponseDTO(PiggyBank p, List<PiggyBankMovement> movements, LocalDate today) {
        List<PiggyBankCalculator.Flow> flows = flowsOf(movements);
        long balance = PiggyBankCalculator.principal(flows);
        long yield = PiggyBankCalculator.estimatedYield(flows, p.getAnnualRate(), today);
        long total = balance + yield;

        PiggyBankResponseDTO dto = new PiggyBankResponseDTO();
        dto.setId(p.getId());
        dto.setName(p.getName());
        dto.setDescription(p.getDescription());
        dto.setIcon(p.getIcon());
        dto.setColor(p.getColor());
        dto.setGoalInCents(p.getGoalInCents());
        dto.setTargetDate(p.getTargetDate());
        dto.setAnnualRate(p.getAnnualRate());
        dto.setIsEmergency(p.getIsEmergency());
        dto.setBalanceInCents(balance);
        dto.setEstimatedYieldInCents(yield);
        dto.setTotalInCents(total);
        dto.setProgressPercent(PiggyBankCalculator.progressPercent(total, p.getGoalInCents()));
        dto.setGoalReached(p.getGoalInCents() != null && total >= p.getGoalInCents());
        dto.setCreatedAt(p.getCreatedAt());
        dto.setUpdatedAt(p.getUpdatedAt());
        return dto;
    }

    private PiggyBankMovementResponseDTO toMovementDTO(PiggyBankMovement m) {
        PiggyBankMovementResponseDTO dto = new PiggyBankMovementResponseDTO();
        dto.setId(m.getId());
        dto.setMovementType(m.getMovementType());
        dto.setAmountInCents(m.getAmountInCents());
        dto.setMovementDate(m.getMovementDate());
        dto.setCreatedAt(m.getCreatedAt());
        if (m.getAccount() != null) {
            dto.setAccountId(m.getAccount().getId());
            dto.setAccountName(m.getAccount().getName());
        }
        return dto;
    }
}