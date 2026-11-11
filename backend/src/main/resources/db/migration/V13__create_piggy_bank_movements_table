-- V13__create_piggy_bank_movements_table.sql
-- Depósitos (guardar) e retiradas de um porquinho. O saldo do porquinho = soma destas linhas
-- (DEPOSIT soma, WITHDRAWAL subtrai).

CREATE TABLE piggy_bank_movements (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    piggy_bank_id    UUID         NOT NULL,
    account_id       UUID,                              -- conta de onde saiu / para onde voltou o dinheiro
    transaction_id   UUID,                              -- transação neutra gerada no extrato da conta

    movement_type    VARCHAR(15)  NOT NULL,             -- DEPOSIT, WITHDRAWAL
    amount_in_cents  BIGINT       NOT NULL,
    movement_date    TIMESTAMP    NOT NULL DEFAULT NOW(),

    created_at       TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP    NOT NULL DEFAULT NOW(),

    -- Excluir o porquinho apaga o histórico dele (o dinheiro já foi devolvido a uma conta)
    CONSTRAINT fk_piggy_movements_piggy
        FOREIGN KEY (piggy_bank_id) REFERENCES piggy_banks (id) ON DELETE CASCADE,

    -- Excluir a conta NÃO apaga o histórico nem muda o saldo do porquinho
    CONSTRAINT fk_piggy_movements_account
        FOREIGN KEY (account_id) REFERENCES accounts (id) ON DELETE SET NULL,

    CONSTRAINT fk_piggy_movements_transaction
        FOREIGN KEY (transaction_id) REFERENCES transactions (id) ON DELETE SET NULL,

    CONSTRAINT chk_piggy_movements_type
        CHECK (movement_type IN ('DEPOSIT', 'WITHDRAWAL')),

    CONSTRAINT chk_piggy_movements_amount
        CHECK (amount_in_cents > 0)
);

-- Extrato e saldo de um porquinho, em ordem de data (também cobre buscas só por piggy_bank_id)
CREATE INDEX idx_piggy_movements_piggy_date ON piggy_bank_movements (piggy_bank_id, movement_date);

-- Chaves estrangeiras consultadas ao excluir conta/transação
CREATE INDEX idx_piggy_movements_account_id ON piggy_bank_movements (account_id);
CREATE INDEX idx_piggy_movements_transaction_id ON piggy_bank_movements (transaction_id);

-- Novos tipos de transação, neutros nos relatórios (não são receita nem despesa):
--   PIGGY_DEPOSIT    = guardar no porquinho (o saldo da conta DIMINUI)
--   PIGGY_WITHDRAWAL = retirar do porquinho (o saldo da conta AUMENTA)
-- A coluna era VARCHAR(10); 'PIGGY_WITHDRAWAL' tem 16 caracteres.
ALTER TABLE transactions ALTER COLUMN transaction_type TYPE VARCHAR(20);

ALTER TABLE transactions DROP CONSTRAINT chk_transaction_type;
ALTER TABLE transactions ADD CONSTRAINT chk_transaction_type
    CHECK (transaction_type IN ('CREDIT', 'DEBIT', 'TRANSFER', 'PIGGY_DEPOSIT', 'PIGGY_WITHDRAWAL'));