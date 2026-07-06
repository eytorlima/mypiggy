package com.mypiggy.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

@Entity
@DiscriminatorValue("BANK_ACCOUNT")
@Getter
@Setter
@NoArgsConstructor
public class BankAccount extends Account {

    @Column(name = "agency", length = 10)
    private String agency;

    @Column(name = "account_number", length = 20)
    private String accountNumber;

    @Column(name = "branch_number", length = 10)
    private String branchNumber;
}