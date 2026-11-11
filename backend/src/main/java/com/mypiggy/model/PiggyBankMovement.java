package com.mypiggy.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

// Depósito (guardar) ou retirada de um porquinho. Saldo do porquinho = soma destas linhas.
@Entity
@Table(name = "piggy_bank_movements")
@Getter
@Setter
@NoArgsConstructor
public class PiggyBankMovement {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "piggy_bank_id", nullable = false)
    private PiggyBank piggyBank;

    // Nulo se a conta foi excluída depois (o histórico e o saldo do porquinho continuam)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id")
    private Account account;

    // Transação neutra gerada no extrato da conta (PIGGY_DEPOSIT / PIGGY_WITHDRAWAL)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transaction_id")
    private Transaction transaction;

    @Column(name = "movement_type", nullable = false, length = 15)
    private String movementType; // DEPOSIT, WITHDRAWAL

    @Column(name = "amount_in_cents", nullable = false)
    private Long amountInCents;

    @Column(name = "movement_date", nullable = false)
    private LocalDateTime movementDate;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}