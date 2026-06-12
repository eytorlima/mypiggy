-- V2__create_accounts_table.sql
-- Tabela de contas com herança via coluna discriminadora (account_type)
-- Tipos suportados: BANK_ACCOUNT, CHECKING_ACCOUNT, SAVINGS_ACCOUNT, WALLET

CREATE TABLE accounts (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID         NOT NULL,

    -- Campos comuns a todos os tipos de conta
    name              VARCHAR(100) NOT NULL,
    balance_in_cents  BIGINT       NOT NULL DEFAULT 0,
    account_type      VARCHAR(30)  NOT NULL,   -- discriminador: BANK_ACCOUNT, CHECKING_ACCOUNT, SAVINGS_ACCOUNT, WALLET
    icon              VARCHAR(50),
    color             VARCHAR(7),              -- hex, ex: #FF5733

    -- Campos específicos de conta bancária (BANK_ACCOUNT / CHECKING / SAVINGS)
    agency            VARCHAR(10),
    account_number    VARCHAR(20),
    branch_number     VARCHAR(10),

    -- Específico de CHECKING_ACCOUNT
    credit_limit_in_cents BIGINT DEFAULT 0,

    -- Específico de SAVINGS_ACCOUNT
    withdrawal_limit_in_cents BIGINT DEFAULT 0,

    created_at        TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP    NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_accounts_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,

    CONSTRAINT chk_account_type
        CHECK (account_type IN ('BANK_ACCOUNT', 'CHECKING_ACCOUNT', 'SAVINGS_ACCOUNT', 'WALLET'))
);

-- Índice para buscar todas as contas de um usuário
CREATE INDEX idx_accounts_user_id ON accounts (user_id);

-- Índice para filtrar por tipo de conta
CREATE INDEX idx_accounts_type ON accounts (account_type);
