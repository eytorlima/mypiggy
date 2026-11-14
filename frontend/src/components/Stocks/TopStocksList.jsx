import {
  FALLBACK_TOP_TICKERS,
  formatPercent,
  formatStockPrice,
  getTrend,
} from '../../utils/stockUtils';
import StockLogo from './StockLogo';

const TREND_TEXT = {
  up: 'text-green-600',
  down: 'text-red-600',
  flat: 'text-gray-500',
};

function StockTile({ stock, active, onSelect }) {
  const hasPrice = stock.price != null;

  return (
    <button
      type="button"
      onClick={() => onSelect(stock.symbol)}
      className={`flex items-center gap-3 rounded-xl border bg-white p-3 text-left shadow-sm transition hover:cursor-pointer hover:border-primary-300 ${
        active ? 'border-primary-500 ring-1 ring-primary-500' : 'border-gray-100'
      }`}
    >
      <StockLogo key={stock.symbol} src={stock.logoUrl} symbol={stock.symbol} size="h-9 w-9" />

      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-gray-800">{stock.symbol}</p>
        {stock.name && <p className="truncate text-xs text-gray-500">{stock.name}</p>}
      </div>

      {hasPrice && (
        <div className="flex-shrink-0 text-right">
          <p className="text-sm font-semibold text-gray-800">{formatStockPrice(stock.price)}</p>
          <p className={`text-xs font-semibold ${TREND_TEXT[getTrend(stock.changePercent)]}`}>
            {formatPercent(stock.changePercent)}
          </p>
        </div>
      )}
    </button>
  );
}

/**
 * Grade com as principais ações. Clicar num cartão abre os detalhes, como numa busca.
 * Se a lista com preços não puder ser carregada, mostra tickers fixos (sem preço):
 * a tela continua útil e os detalhes ainda abrem ao clicar.
 *
 * @param stocks        [{ symbol, name, logoUrl, price, changePercent }]
 * @param loading       boolean
 * @param activeSymbol  ticker selecionado no momento
 * @param onSelect      (symbol) => void
 */
export default function TopStocksList({ stocks, loading, activeSymbol, onSelect }) {
  const usingFallback = !loading && stocks.length === 0;
  const tiles = usingFallback
    ? FALLBACK_TOP_TICKERS.map((symbol) => ({ symbol }))
    : stocks;

  return (
    <section className="rounded-xl bg-white p-4 shadow">
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-gray-800">Principais ações</h2>
        <p className="text-xs text-gray-500">
          {usingFallback
            ? 'Ações mais conhecidas da B3 (preços indisponíveis no momento).'
            : 'Mais negociadas da B3. Clique para ver os detalhes.'}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-[62px] animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {tiles.map((stock) => (
            <StockTile
              key={stock.symbol}
              stock={stock}
              active={stock.symbol === activeSymbol}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </section>
  );
}