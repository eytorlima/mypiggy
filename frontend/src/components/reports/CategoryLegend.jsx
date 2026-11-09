import { keyOf } from '../../utils/categoryColors';
import { formatBRL } from '../../utils/formatCurrency';

/**
 * Legenda clicável. Clicar em uma categoria a oculta/mostra no gráfico.
 *
 * @param items        TODAS as categorias do relatório (inclusive as ocultas)
 * @param colors       mapa { [chave]: '#hex' }
 * @param hidden       Set com as chaves das categorias ocultas
 * @param onToggle     (chave) => void
 * @param visibleTotal soma em centavos só das categorias visíveis (base dos percentuais)
 */
export default function CategoryLegend({ items, colors, hidden, onToggle, visibleTotal }) {
  return (
    <ul className="mt-4 space-y-1">
      {items.map((item) => {
        const key = keyOf(item);
        const isHidden = hidden.has(key);

        // Percentual recalculado só entre as categorias visíveis
        const percent =
          !isHidden && visibleTotal > 0
            ? `${((item.totalInCents / visibleTotal) * 100).toFixed(1).replace('.', ',')}%`
            : '—';

        return (
          <li key={key}>
            <button
              type="button"
              onClick={() => onToggle(key)}
              aria-pressed={!isHidden}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition hover:bg-gray-50 hover:cursor-pointer ${
                isHidden ? 'opacity-40' : ''
              }`}
            >
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: colors[key] }}
              />
              <span className={`flex-1 truncate text-sm ${isHidden ? 'line-through' : ''}`}>
                {item.name}
              </span>
              <span className="w-14 text-right text-sm text-gray-500">{percent}</span>
              <span className="w-28 text-right text-sm font-medium text-gray-800">
                {formatBRL(item.totalInCents)}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}