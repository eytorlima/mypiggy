-- V15__add_recurrence_parent_to_transactions.sql
-- Liga as ocorrências geradas automaticamente de uma transação recorrente
-- à transação original que as originou.
-- NULL = transação comum, ou a própria transação original da série.

ALTER TABLE transactions
    ADD COLUMN recurrence_parent_id UUID;

-- Se a original for excluída, as cópias viram transações comuns (não são apagadas)
ALTER TABLE transactions
    ADD CONSTRAINT fk_transactions_recurrence_parent
        FOREIGN KEY (recurrence_parent_id) REFERENCES transactions (id) ON DELETE SET NULL;

-- Índice para buscar todas as ocorrências de uma série
CREATE INDEX idx_transactions_recurrence_parent ON transactions (recurrence_parent_id);