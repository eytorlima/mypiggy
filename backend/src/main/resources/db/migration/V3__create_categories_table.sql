-- V3__create_categories_table.sql
-- Categorias de transações
-- user_id NULL = categoria padrão do sistema (visível para todos)
-- user_id preenchido = categoria personalizada do usuário

CREATE TABLE categories (
    id          SERIAL PRIMARY KEY,
    user_id     UUID,                          -- NULL = categoria padrão do sistema
    name        VARCHAR(50)  NOT NULL,
    description VARCHAR(255),
    color       VARCHAR(7),                    -- hex, ex: #4CAF50
    icon        VARCHAR(50),                   -- nome do ícone, ex: 'shopping-cart'
    is_default  BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP    NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_categories_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Índice para buscar categorias de um usuário + as padrão
CREATE INDEX idx_categories_user_id ON categories (user_id);

-- Índice para filtrar apenas categorias padrão
CREATE INDEX idx_categories_is_default ON categories (is_default);
