import { useEffect, useRef, useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import { SkeletonCard } from '../../components/ui/SkeletonCard';
import StockCard from '../../components/stocks/StockCard';
import StockSearch from '../../components/stocks/StockSearch';
import StockTicker from '../../components/stocks/StockTicker';
import TopStocksList from '../../components/stocks/TopStocksList';
import { useFavoriteStocks } from '../../hooks/useFavoriteStocks';
import { useTopStocks } from '../../hooks/useTopStocks';
import { clearStockCache, getHistory, getQuote } from '../../services/stockService';

function TickerChip({ symbol, active, onSelect, onRemove }) {
  return (
    <span
      className={`inline-flex items-center overflow-hidden rounded-full text-sm font-medium transition ${
        active ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      <button
        type="button"
        onClick={() => onSelect(symbol)}
        className="py-1 pl-3 pr-1.5 hover:cursor-pointer"
      >
        {symbol}
      </button>
      <button
        type="button"
        onClick={() => onRemove(symbol)}
        aria-label={`Remover ${symbol} dos favoritos`}
        className="py-1 pl-0.5 pr-2 opacity-60 hover:cursor-pointer hover:opacity-100"
      >
        <CloseIcon style={{ fontSize: 14 }} />
      </button>
    </span>
  );
}

export function StocksPage() {
  // ---- Ativo selecionado e seus dados ----
  const [symbol, setSymbol] = useState('');
  const [reloadKey, setReloadKey] = useState(0); // incrementar força nova consulta
  const [period, setPeriod] = useState('1S'); // período do gráfico; mantido ao trocar de ação

  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState('');

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');

  const { favorites, isFavorite, toggleFavorite, removeFavorite } = useFavoriteStocks();

  // Uma única consulta alimenta a faixa rolante e a lista de principais ações
  const topStocks = useTopStocks();

  const resultRef = useRef(null);

  // Cotação e histórico são buscados juntos, mas cada um tem o seu loading/erro:
  // o card aparece assim que a cotação chega, e o gráfico carrega por conta própria.
  useEffect(() => {
    if (!symbol) return;

    let cancelled = false; // evita que uma resposta antiga sobrescreva uma mais nova

    setQuote(null);
    setQuoteError('');
    setQuoteLoading(true);
    setHistory([]);
    setHistoryError('');
    setHistoryLoading(true);

    getQuote(symbol)
      .then((data) => {
        if (!cancelled) setQuote(data);
      })
      .catch((error) => {
        if (!cancelled) setQuoteError(error.message);
      })
      .finally(() => {
        if (!cancelled) setQuoteLoading(false);
      });

    getHistory(symbol)
      .then((data) => {
        if (!cancelled) setHistory(data);
      })
      .catch((error) => {
        if (!cancelled) setHistoryError(error.message);
      })
      .finally(() => {
        if (!cancelled) setHistoryLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [symbol, reloadKey]);

  // Busca, favoritos, lista e faixa rolante passam por aqui. O resultado aparece acima da
  // lista, então rolamos até ele (o clique pode ter sido lá embaixo, na grade de ações).
  function handleSelect(next) {
    setSymbol(next);
    requestAnimationFrame(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function handleRefresh() {
    clearStockCache(); // ignora o cache de 60 s e busca de novo
    setReloadKey((key) => key + 1);
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 px-4 pb-28 pt-4">
      <h1 className="text-center text-lg font-bold uppercase tracking-wide text-gray-800">
        Ações
      </h1>

      <StockTicker
        stocks={topStocks.stocks}
        loading={topStocks.loading}
        onSelect={handleSelect}
      />

      <StockSearch onSelect={handleSelect} />

      {/* ---------- Favoritos ---------- */}
      {favorites.length > 0 && (
        <section className="rounded-xl bg-white p-4 shadow">
          <h2 className="mb-2 text-sm font-semibold text-gray-800">Favoritas</h2>
          <div className="flex flex-wrap gap-2">
            {favorites.map((favorite) => (
              <TickerChip
                key={favorite}
                symbol={favorite}
                active={favorite === symbol}
                onSelect={handleSelect}
                onRemove={removeFavorite}
              />
            ))}
          </div>
        </section>
      )}

      {/* ---------- Resultado (ou estado inicial) ---------- */}
      <div ref={resultRef} className="scroll-mt-4 space-y-4">
        {!symbol && (
          <section className="rounded-xl bg-white p-6 text-center shadow">
            <ShowChartIcon className="text-primary-500" style={{ fontSize: 40 }} />
            <p className="mt-2 text-sm text-gray-600">
              Busque uma ação pelo ticker ou pelo nome da empresa, ou escolha uma das principais
              ações abaixo, para ver a cotação e o gráfico dos últimos 7 pregões.
            </p>
          </section>
        )}

        {symbol && quoteLoading && <SkeletonCard height="h-72" />}

        {symbol && !quoteLoading && quoteError && (
          <section className="rounded-xl bg-white p-6 text-center shadow">
            <p className="text-sm text-red-600">{quoteError}</p>
            <button
              type="button"
              onClick={handleRefresh}
              className="mt-3 rounded-lg bg-gray-800 px-4 py-1.5 text-xs font-medium text-white transition hover:cursor-pointer hover:bg-gray-700"
            >
              Tentar novamente
            </button>
          </section>
        )}

        {quote && !quoteLoading && !quoteError && (
          <StockCard
            quote={quote}
            history={history}
            historyLoading={historyLoading}
            historyError={historyError}
            period={period}
            onChangePeriod={setPeriod}
            isFavorite={isFavorite(quote.symbol)}
            onToggleFavorite={() => toggleFavorite(quote.symbol)}
            onRefresh={handleRefresh}
          />
        )}
      </div>

      {/* ---------- Principais ações ---------- */}
      <TopStocksList
        stocks={topStocks.stocks}
        loading={topStocks.loading}
        activeSymbol={symbol}
        onSelect={handleSelect}
      />

      <p className="text-center text-xs text-gray-400">
        Dados fornecidos por brapi.dev. As cotações podem ter atraso e não constituem recomendação
        de investimento.
      </p>
    </div>
  );
}