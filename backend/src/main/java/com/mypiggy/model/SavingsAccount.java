package com.mypiggy.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

@Entity
@DiscriminatorValue("SAVINGS_ACCOUNT")
@Getter
@Setter
@NoArgsConstructor
public class SavingsAccount extends Account {

    @Column(name = "withdrawal_limit_in_cents")
    private Long withdrawalLimitInCents = 0L;
}