-- V16__create_user_settings_table.sql
-- Preferências do usuário (1 linha por usuário).
-- O sistema é exclusivo para o Brasil: moeda BRL, idioma pt-BR e horário de Brasília.
-- Os CHECKs travam esses valores no banco; se um dia houver outro valor,
-- basta uma nova migration trocando a restrição.

CREATE TABLE user_settings (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id               UUID         NOT NULL,

    currency              VARCHAR(3)   NOT NULL DEFAULT 'BRL',
    language              VARCHAR(10)  NOT NULL DEFAULT 'pt-BR',
    time_zone             VARCHAR(50)  NOT NULL DEFAULT 'America/Sao_Paulo',
    notification_enabled  BOOLEAN      NOT NULL DEFAULT TRUE,

    created_at            TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMP    NOT NULL DEFAULT NOW(),

    -- UNIQUE já cria o índice em user_id: garante 1 configuração por usuário
    CONSTRAINT uq_user_settings_user
        UNIQUE (user_id),

    CONSTRAINT fk_user_settings_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,

    CONSTRAINT chk_user_settings_currency
        CHECK (currency = 'BRL'),

    CONSTRAINT chk_user_settings_language
        CHECK (language = 'pt-BR'),

    CONSTRAINT chk_user_settings_time_zone
        CHECK (time_zone = 'America/Sao_Paulo')
);

-- Usuários que já existem também ganham as configurações padrão
-- (usuários novos ganham no cadastro, pelo back-end).
INSERT INTO user_settings (user_id)
SELECT id FROM users;