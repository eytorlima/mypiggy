-- V8__update_categories_color_icon_to_semantic.sql
UPDATE categories SET color = 'orange',  icon = 'utensils'  WHERE name = 'Alimentação';
UPDATE categories SET color = 'blue',    icon = 'car'       WHERE name = 'Transporte';
UPDATE categories SET color = 'gray',    icon = 'home'      WHERE name = 'Moradia';
UPDATE categories SET color = 'red',     icon = 'heart'     WHERE name = 'Saúde';
UPDATE categories SET color = 'purple',  icon = 'school'    WHERE name = 'Educação';
UPDATE categories SET color = 'orange',  icon = 'smile'     WHERE name = 'Lazer';
UPDATE categories SET color = 'pink',    icon = 'shirt'     WHERE name = 'Vestuário';
UPDATE categories SET color = 'gray',    icon = 'repeat'    WHERE name = 'Assinaturas';
UPDATE categories SET color = 'green',   icon = 'pet'       WHERE name = 'Pets';
UPDATE categories SET color = 'gray',    icon = 'tax'       WHERE name = 'Impostos';
UPDATE categories SET color = 'green',   icon = 'briefcase' WHERE name = 'Salário';
UPDATE categories SET color = 'blue',    icon = 'laptop'    WHERE name = 'Freelance';
UPDATE categories SET color = 'purple',  icon = 'trending'  WHERE name = 'Investimentos';
UPDATE categories SET color = 'yellow',  icon = 'gift'      WHERE name = 'Presente';
UPDATE categories SET color = 'gray',    icon = 'transfer'  WHERE name = 'Transferência';
UPDATE categories SET color = 'gray',    icon = 'other'     WHERE name = 'Outros';