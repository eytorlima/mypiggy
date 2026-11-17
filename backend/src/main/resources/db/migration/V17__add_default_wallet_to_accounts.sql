-- Conta padrão ("Carteira"): uma por usuário, não pode ser excluída nem renomeada
ALTER TABLE accounts
    ADD COLUMN is_default BOOLEAN NOT NULL DEFAULT FALSE;

-- 1) Quem já tem uma conta "Carteira" (tipo WALLET, saldo não negativo):
--    a mais antiga vira a padrão
UPDATE accounts
SET is_default = TRUE,
    name = 'Carteira'
WHERE id IN (
    SELECT DISTINCT ON (user_id) id
    FROM accounts
    WHERE account_type = 'WALLET'
      AND LOWER(name) = 'carteira'
      AND balance_in_cents >= 0
    ORDER BY user_id, created_at
);

-- 2) Quem ainda não tem conta padrão ganha uma Carteira com saldo zero
INSERT INTO accounts (id, user_id, name, account_type, balance_in_cents,
                      color, icon, is_default, created_at, updated_at)
SELECT gen_random_uuid(), u.id, 'Carteira', 'WALLET', 0,
       'orange', 'wallet', TRUE, NOW(), NOW()
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM accounts a WHERE a.user_id = u.id AND a.is_default = TRUE
);

-- No máximo uma conta padrão por usuário (garantido pelo banco)
CREATE UNIQUE INDEX uq_accounts_one_default_per_user
    ON accounts (user_id)
    WHERE is_default = TRUE;