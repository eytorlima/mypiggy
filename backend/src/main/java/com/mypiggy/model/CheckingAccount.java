package com.mypiggy.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

@Entity
@DiscriminatorValue("CHECKING_ACCOUNT")
@Getter
@Setter
@NoArgsConstructor
public class CheckingAccount extends Account {

    @Column(name = "credit_limit_in_cents")
    private Long creditLimitInCents = 0L;
}