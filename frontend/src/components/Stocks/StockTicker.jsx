import { formatPercent, formatStockPrice, getTrend } from '../../utils/stockUtils';

const TREND_STYLE = {
  up: { text: 'text-primary-400', arrow: '▲' },
  down: { text: 'text-red-400', arrow: '▼' },
  flat: { text: 'text-gray-400', arrow: '•' },
};

/**
 * Faixa rolante (ticker tape) com ticker, preço e variação das principais ações.
 * Usa os mesmos dados da lista de "Principais ações": não faz nenhuma requisição própria.
 *
 * A lista é renderizada 2 vezes seguidas e a animação (classe .ticker-track, em index.css)
 * desloca -50%: quando a 1ª cópia sai de cena, a 2ª ocupa exatamente o mesmo lugar,
 * e o loop parece contínuo. Pausa ao passar o mouse e respeita "reduzir movimento".
 *
 * @param stocks    [{ symbol, price, changePercent }]
 * @param loading   boolean
 * @param onSelect  (symbol) => void
 */
export default function StockTicker({ stocks, loading, onSelect }) {
  if (loading) {
    return <div className="h-10 animate-pulse rounded-xl bg-gray-200" />;
  }

  const items = stocks.filter((stock) => stock.price != null);
  if (items.length === 0) return null; // sem dados: some em vez de mostrar uma faixa vazia

  const loop = [...items, ...items];

  return (
    <div
      className="overflow-hidden rounded-xl bg-gray-900 py-2.5 shadow"
      aria-label="Cotações das principais ações"
    >
      <div
        className="ticker-track flex w-max"
        style={{ animationDuration: `${items.length * 5}s` }}
      >
        {loop.map((item, index) => {
          const style = TREND_STYLE[getTrend(item.changePercent)];
          const isCopy = index >= items.length; // a 2ª cópia é só visual

          return (
            <button
              key={`${item.symbol}-${index}`}
              type="button"
              onClick={() => onSelect(item.symbol)}
              aria-hidden={isCopy}
              tabIndex={isCopy ? -1 : 0}
              className="flex flex-shrink-0 items-center gap-2 border-r border-gray-700 px-5 text-sm hover:cursor-pointer"
            >
              <span className="font-semibold text-white">{item.symbol}</span>
              <span className="text-gray-300">{formatStockPrice(item.price)}</span>
              <span className={`font-semibold ${style.text}`}>
                {style.arrow} {formatPercent(item.changePercent)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}