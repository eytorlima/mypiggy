-- V14__piggy_banks_color_length.sql
-- A cor dos porquinhos pode ser um nome (ex.: "green") ou hex; a V12 limitou a 7 caracteres.
-- Alinha com a coluna color de accounts (entidade com length = 20).
ALTER TABLE piggy_banks ALTER COLUMN color TYPE VARCHAR(20);