-- V12__create_piggy_banks_table.sql
-- Porquinhos (caixinhas) e metas de economia.
--   Porquinho livre: goal_in_cents NULL (sem valor-alvo)
--   Meta:            goal_in_cents preenchido (obrigatoriamente > 0); target_date opcional
-- O saldo de um porquinho NÃO fica nesta tabela: é a soma de piggy_bank_movements (V13).
-- O rendimento também não é gravado: é estimado na leitura a partir de annual_rate.

CREATE TABLE piggy_banks (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID         NOT NULL,

    name           VARCHAR(100) NOT NULL,
    description    VARCHAR(255),
    icon           VARCHAR(50),
    color          VARCHAR(7),                          -- hex, ex: #FF5733

    goal_in_cents  BIGINT,                              -- NULL = porquinho sem meta
    target_date    DATE,                                -- prazo da meta (opcional)
    annual_rate    NUMERIC(7, 4),                       -- rendimento em % ao ano (ex.: 10.5000 = 10,5% a.a.); NULL = sem rendimento

    is_emergency   BOOLEAN      NOT NULL DEFAULT FALSE, -- reserva de emergência: não pode ser excluída

    created_at     TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMP    NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_piggy_banks_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,

    CONSTRAINT chk_piggy_banks_goal
        CHECK (goal_in_cents IS NULL OR goal_in_cents > 0),

    -- Prazo só faz sentido para quem tem meta
    CONSTRAINT chk_piggy_banks_target_date
        CHECK (target_date IS NULL OR goal_in_cents IS NOT NULL),

    CONSTRAINT chk_piggy_banks_rate
        CHECK (annual_rate IS NULL OR annual_rate >= 0)
);

-- Listar os porquinhos de um usuário (Dashboard e tela de Metas)
CREATE INDEX idx_piggy_banks_user_id ON piggy_banks (user_id);

-- No máximo UMA reserva de emergência por usuário, garantido pelo próprio banco
CREATE UNIQUE INDEX uq_piggy_banks_user_emergency
    ON piggy_banks (user_id) WHERE is_emergency;

-- Usuários que já existem também ganham a reserva de emergência
-- (usuários novos ganham no cadastro, pelo back-end). Sem rendimento e sem meta.
INSERT INTO piggy_banks (user_id, name, description, is_emergency)
SELECT id, 'Reserva de emergência', 'Valor guardado para imprevistos', TRUE
FROM users;