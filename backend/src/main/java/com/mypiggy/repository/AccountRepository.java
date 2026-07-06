package com.mypiggy.repository;

import com.mypiggy.model.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AccountRepository extends JpaRepository<Account, UUID> {

    List<Account> findAllByUserId(UUID userId);

    Optional<Account> findByIdAndUserId(UUID id, UUID userId);

    @Query("SELECT COALESCE(SUM(a.balanceInCents), 0) FROM Account a WHERE a.user.id = :userId")
    Long sumBalanceByUserId(UUID userId);
}