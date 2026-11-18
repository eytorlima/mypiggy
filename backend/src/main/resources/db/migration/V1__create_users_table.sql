-- V1__create_users_table.sql
-- Tabela principal de usuários do sistema

CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(100)        NOT NULL,
    email         VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255)        NOT NULL,
    cpf           VARCHAR(11)  UNIQUE NOT NULL,
    phone         VARCHAR(20)         NOT NULL,
    birth_date    DATE                NOT NULL,
    created_at    TIMESTAMP           NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP           NOT NULL DEFAULT NOW()
);

-- Índice para buscas por email (login)
CREATE INDEX idx_users_email ON users (email);

-- Índice para buscas por CPF
CREATE INDEX idx_users_cpf ON users (cpf);
