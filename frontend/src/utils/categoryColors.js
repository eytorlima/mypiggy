// O backend guarda a cor da categoria de forma semântica ('orange', 'blue', 'gray'...),
// conforme a migration V8. Aqui transformamos esses nomes em cores reais (hex).
//
// Problema: várias categorias dividem o mesmo nome de cor (ex.: 5 são 'gray' e
// 2 são 'orange'). Num gráfico de pizza, fatias vizinhas da mesma cor ficariam
// indistinguíveis. Por isso cada cor tem uma lista de tons: a 1ª categoria 'gray'
// usa o 1º tom, a 2ª usa o 2º, e assim por diante.

const SHADES = {
  orange: ['#f97316', '#fb923c', '#ea580c', '#fdba74', '#c2410c'],
  blue: ['#3b82f6', '#60a5fa', '#2563eb', '#93c5fd', '#1d4ed8'],
  gray: ['#6b7280', '#9ca3af', '#4b5563', '#d1d5db', '#374151'],
  red: ['#ef4444', '#f87171', '#dc2626', '#fca5a5', '#b91c1c'],
  purple: ['#a855f7', '#c084fc', '#9333ea', '#d8b4fe', '#7e22ce'],
  pink: ['#ec4899', '#f472b6', '#db2777', '#f9a8d4', '#be185d'],
  green: ['#22c55e', '#4ade80', '#16a34a', '#86efac', '#15803d'],
  yellow: ['#eab308', '#facc15', '#ca8a04', '#fde047', '#a16207'],
};

// Cores fixas dos gráficos de receita x despesa
export const INCOME_COLOR = '#22c55e';
export const EXPENSE_COLOR = '#ef4444';

/**
 * Chave estável de um item do relatório.
 * "Sem categoria" vem com categoryId nulo, então usamos 'none'.
 */
export function keyOf(item) {
  return item.categoryId ?? 'none';
}

/**
 * Recebe TODOS os itens do relatório e devolve { [chave]: '#hex' }.
 * Deve ser chamada com a lista completa (não só as categorias visíveis),
 * assim a cor de uma categoria não muda quando o usuário oculta outra.
 */
export function assignCategoryColors(items) {
  const usedCount = {};
  const colors = {};

  items.forEach((item) => {
    const name = SHADES[item.color] ? item.color : 'gray'; // cor desconhecida -> cinza
    const index = usedCount[name] ?? 0;
    usedCount[name] = index + 1;

    const shades = SHADES[name];
    colors[keyOf(item)] = shades[index % shades.length];
  });

  return colors;
}