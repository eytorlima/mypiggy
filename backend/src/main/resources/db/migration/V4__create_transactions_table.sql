-- V4__create_transactions_table.sql
-- Tabela de transações financeiras
-- Cobre: receitas (CREDIT), despesas (DEBIT) e transferências (TRANSFER)

CREATE TABLE transactions (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id             UUID         NOT NULL,
    category_id            INT,
    destination_account_id UUID,                   -- preenchido apenas em TRANSFER

    amount_in_cents        BIGINT       NOT NULL,
    description            TEXT,
    transaction_date       TIMESTAMP    NOT NULL DEFAULT NOW(),
    transaction_type       VARCHAR(10)  NOT NULL,   -- CREDIT, DEBIT, TRANSFER

    -- Recorrência
    is_recurring           BOOLEAN      NOT NULL DEFAULT FALSE,
    recurrency_type        VARCHAR(10),             -- DAILY, WEEKLY, MONTHLY, ANNUAL

    -- Tags (armazenadas como texto separado por vírgula, simples para TCC)
    tags                   VARCHAR(255),

    created_at             TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at             TIMESTAMP    NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_transactions_account
        FOREIGN KEY (account_id) REFERENCES accounts (id) ON DELETE CASCADE,

    CONSTRAINT fk_transactions_category
        FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE SET NULL,

    CONSTRAINT fk_transactions_destination
        FOREIGN KEY (destination_account_id) REFERENCES accounts (id) ON DELETE SET NULL,

    CONSTRAINT chk_transaction_type
        CHECK (transaction_type IN ('CREDIT', 'DEBIT', 'TRANSFER')),

    CONSTRAINT chk_recurrency_type
        CHECK (recurrency_type IN ('DAILY', 'WEEKLY', 'MONTHLY', 'ANNUAL') OR recurrency_type IS NULL)
);

-- Índice para buscar transações de uma conta
CREATE INDEX idx_transactions_account_id ON transactions (account_id);

-- Índice para filtrar por data (relatórios mensais)
CREATE INDEX idx_transactions_date ON transactions (transaction_date);

-- Índice para filtrar por tipo (receitas, despesas)
CREATE INDEX idx_transactions_type ON transactions (transaction_type);

-- Índice para buscar transações recorrentes
CREATE INDEX idx_transactions_recurring ON transactions (is_recurring);
