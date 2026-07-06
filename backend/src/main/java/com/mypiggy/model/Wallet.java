package com.mypiggy.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

@Entity
@DiscriminatorValue("WALLET")
@Getter
@Setter
@NoArgsConstructor
public class Wallet extends Account {
    // Carteira manual não tem campos específicos além dos herdados
}