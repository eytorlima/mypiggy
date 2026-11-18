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
              aria-label={`${item.name}, ${formatBRL(item.totalInCents)}, ${isHidden ? 'oculta' : 'visível'} no gráfico`}
              className="flex w-full items-center gap-2 sm:gap-3 rounded-lg px-2 sm:px-3 py-2.5 sm:py-2 text-left transition hover:bg-gray-50 hover:cursor-pointer"
            >
              <span
                aria-hidden="true"
                className={`h-3 w-3 shrink-0 rounded-full ${isHidden ? 'opacity-40' : ''}`}
                style={{ backgroundColor: colors[key] }}
              />
              <span
                className={`flex-1 min-w-0 truncate text-sm ${
                  isHidden ? 'line-through text-gray-500' : 'text-gray-800'
                }`}
                title={item.name}
              >
                {item.name}
              </span>
              <span className="w-12 sm:w-14 text-right text-xs sm:text-sm text-gray-600" aria-hidden="true">
                {percent}
              </span>
              <span
                className={`w-24 sm:w-28 text-right text-xs sm:text-sm font-medium ${
                  isHidden ? 'text-gray-500' : 'text-gray-800'
                }`}
                aria-hidden="true"
              >
                {formatBRL(item.totalInCents)}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}