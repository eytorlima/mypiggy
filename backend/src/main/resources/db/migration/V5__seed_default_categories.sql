-- V5__seed_default_categories.sql
-- Categorias padrão do sistema (user_id NULL, is_default TRUE)
-- Disponíveis para todos os usuários

INSERT INTO categories (user_id, name, description, color, icon, is_default) VALUES

-- Despesas
(NULL, 'Alimentação',      'Supermercado, restaurantes e delivery',  '#FF5722', 'utensils',        TRUE),
(NULL, 'Transporte',       'Combustível, Uber, ônibus e metrô',      '#2196F3', 'car',             TRUE),
(NULL, 'Moradia',          'Aluguel, condomínio e contas da casa',   '#795548', 'home',            TRUE),
(NULL, 'Saúde',            'Plano de saúde, farmácia e consultas',   '#F44336', 'heart-pulse',     TRUE),
(NULL, 'Educação',         'Cursos, livros e mensalidades',          '#9C27B0', 'graduation-cap',  TRUE),
(NULL, 'Lazer',            'Cinema, viagens e hobbies',              '#FF9800', 'smile',           TRUE),
(NULL, 'Vestuário',        'Roupas, calçados e acessórios',          '#E91E63', 'shirt',           TRUE),
(NULL, 'Assinaturas',      'Streaming, apps e serviços digitais',    '#607D8B', 'repeat',          TRUE),
(NULL, 'Pets',             'Alimentação e cuidados com animais',     '#8BC34A', 'paw-print',       TRUE),
(NULL, 'Impostos',         'IPTU, IPVA e taxas governamentais',      '#9E9E9E', 'landmark',        TRUE),

-- Receitas
(NULL, 'Salário',          'Renda mensal do trabalho formal',        '#4CAF50', 'briefcase',       TRUE),
(NULL, 'Freelance',        'Renda de trabalhos autônomos',           '#00BCD4', 'laptop',          TRUE),
(NULL, 'Investimentos',    'Rendimentos de aplicações financeiras',  '#3F51B5', 'trending-up',     TRUE),
(NULL, 'Presente',         'Dinheiro recebido como presente',        '#FFC107', 'gift',            TRUE),

-- Neutro
(NULL, 'Transferência',    'Movimentação entre contas próprias',     '#78909C', 'arrow-right-left',TRUE),
(NULL, 'Outros',           'Transações que não se encaixam acima',   '#BDBDBD', 'circle-ellipsis', TRUE);
