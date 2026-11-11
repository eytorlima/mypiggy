package com.mypiggy.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

// Porquinho (caixinha) ou meta. O saldo NÃO fica aqui: é a soma de PiggyBankMovement.
@Entity
@Table(name = "piggy_banks")
@Getter
@Setter
@NoArgsConstructor
public class PiggyBank {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "description", length = 255)
    private String description;

    @Column(name = "icon", length = 50)
    private String icon;

    @Column(name = "color", length = 20)
    private String color;

    // Nulo = porquinho sem meta
    @Column(name = "goal_in_cents")
    private Long goalInCents;

    @Column(name = "target_date")
    private LocalDate targetDate;

    // Rendimento em % ao ano (10.5 = 10,5% a.a.); nulo = sem rendimento
    @Column(name = "annual_rate", precision = 7, scale = 4)
    private BigDecimal annualRate;

    // Reserva de emergência: criada no cadastro, não pode ser excluída nem renomeada
    @Column(name = "is_emergency", nullable = false)
    private Boolean isEmergency = false;

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