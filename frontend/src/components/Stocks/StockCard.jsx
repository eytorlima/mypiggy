import { useMemo } from 'react';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import RefreshIcon from '@mui/icons-material/Refresh';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import { SkeletonCard } from '../ui/SkeletonCard';
import { EXPENSE_COLOR, INCOME_COLOR } from '../../utils/categoryColors';
import {
  PERIODS,
  formatCompact,
  formatDateTime,
  formatFullDate,
  formatPercent,
  formatSigned,
  formatStockPrice,
  getTrend,
  isPeriodAvailable,
  periodRequirement,
  sliceByPeriod,
} from '../../utils/stockUtils';
import StockLogo from './StockLogo';
import StockPriceChart from './StockPriceChart';

const TREND_TEXT = {
  up: 'text-green-600',
  down: 'text-red-600',
  flat: 'text-gray-500',
};

const TREND_ICON = {
  up: TrendingUpIcon,
  down: TrendingDownIcon,
  flat: TrendingFlatIcon,
};

const GAP_TOLERANCE_SECONDS = 10 * 86400; // folga antes de avisar que faltam dados no começo

/**
 * Card de um ativo: nome, preço, variação do dia, gráfico por período e indicadores.
 *
 * @param quote            objeto devolvido por getQuote()
 * @param history          TODOS os candles devolvidos por getHistory() (o recorte é feito aqui)
 * @param historyLoading   o gráfico tem carregamento próprio (2ª requisição)
 * @param historyError     mensagem de erro do histórico ('' se não houve)
 * @param period           chave do período selecionado ('1S' | '1M' | '3M' | '1A' | 'MAX')
 * @param onChangePeriod   (key) => void
 * @param isFavorite       boolean
 * @param onToggleFavorite () => void
 * @param onRefresh        () => void
 */
export default function StockCard({
  quote,
  history,
  historyLoading,
  historyError,
  period,
  onChangePeriod,
  isFavorite,
  onToggleFavorite,
  onRefresh,
}) {
  const trend = getTrend(quote.change);
  const TrendIcon = TREND_ICON[trend];

  const periodInfo = PERIODS.find((item) => item.key === period) ?? PERIODS[0];

  // Recorte do período (valor derivado: trocar de período não faz nenhuma requisição)
  const visible = useMemo(() => sliceByPeriod(history, period), [history, period]);

  // Variação % entre o primeiro e o último ponto do período
  const periodChange = useMemo(() => {
    if (visible.length < 2) return null;
    const first = visible[0].close;
    const last = visible[visible.length - 1].close;
    if (!first) return null;
    return ((last - first) / first) * 100;
  }, [visible]);

  const chartColor = periodChange != null && periodChange < 0 ? EXPENSE_COLOR : INCOME_COLOR;

  // Aviso se a API entregou menos histórico do que o período pede (limite do plano ou ação recente)
  const firstDate = visible[0]?.date;
  const lastDate = visible[visible.length - 1]?.date;
  const limitedHistory =
    periodInfo.days != null &&
    visible.length > 0 &&
    firstDate - (lastDate - periodInfo.days * 86400) > GAP_TOLERANCE_SECONDS;

  const hasLockedPeriod = PERIODS.some((item) => !isPeriodAvailable(item));

  const stats = [
    ['Abertura', formatStockPrice(quote.open)],
    ['Fech. anterior', formatStockPrice(quote.previousClose)],
    ['Máxima do dia', formatStockPrice(quote.dayHigh)],
    ['Mínima do dia', formatStockPrice(quote.dayLow)],
    ['Volume', formatCompact(quote.volume)],
    ['Valor de mercado', quote.marketCap != null ? `R$ ${formatCompact(quote.marketCap)}` : '—'],
    ['Mín. 52 semanas', formatStockPrice(quote.yearLow)],
    ['Máx. 52 semanas', formatStockPrice(quote.yearHigh)],
  ];

  return (
    <section className="rounded-xl bg-white p-4 shadow sm:p-6">
      {/* Cabeçalho: logo, ticker, nome e ações */}
      <div className="flex items-start gap-3">
        <StockLogo key={quote.symbol} src={quote.logoUrl} symbol={quote.symbol} size="h-12 w-12" />

        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-gray-800">{quote.symbol}</h2>
          <p className="truncate text-sm text-gray-500">{quote.name}</p>
        </div>

        <div className="flex flex-shrink-0 gap-1">
          <button
            type="button"
            onClick={onRefresh}
            aria-label="Atualizar cotação"
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:cursor-pointer hover:bg-gray-100 hover:text-gray-600"
          >
            <RefreshIcon fontSize="small" />
          </button>
          <button
            type="button"
            onClick={onToggleFavorite}
            aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            aria-pressed={isFavorite}
            className={`rounded-lg p-1.5 transition-colors hover:cursor-pointer hover:bg-gray-100 ${
              isFavorite ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'
            }`}
          >
            {isFavorite ? <StarIcon fontSize="small" /> : <StarBorderIcon fontSize="small" />}
          </button>
        </div>
      </div>

      {/* Preço e variação do dia */}
      <div className="mt-4 flex flex-wrap items-end gap-x-4 gap-y-1">
        <p className="text-3xl font-bold text-gray-800">{formatStockPrice(quote.price)}</p>
        <p className={`flex items-center gap-1 pb-1 text-sm font-semibold ${TREND_TEXT[trend]}`}>
          <TrendIcon fontSize="small" />
          {formatSigned(quote.change)} ({formatPercent(quote.changePercent)})
          <span className="font-normal text-gray-400">hoje</span>
        </p>
      </div>

      {quote.updatedAt && (
        <p className="mt-1 text-xs text-gray-400">
          Atualizado em {formatDateTime(quote.updatedAt)}
        </p>
      )}

      {/* Evolução por período */}
      <div className="mt-6">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-gray-800">Evolução do preço</h3>

          <div className="flex gap-1" role="group" aria-label="Período do gráfico">
            {PERIODS.map((item) => {
              const available = isPeriodAvailable(item);
              const selected = item.key === period;

              return (
                <button
                  key={item.key}
                  type="button"
                  disabled={!available}
                  onClick={() => onChangePeriod(item.key)}
                  aria-pressed={selected}
                  title={available ? item.title : periodRequirement(item)}
                  className={`rounded-lg px-3 py-1 text-xs font-medium transition ${
                    selected
                      ? 'bg-gray-800 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  } ${available ? 'hover:cursor-pointer' : 'cursor-not-allowed opacity-40'}`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {!historyLoading && !historyError && visible.length >= 2 && (
          <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3 text-xs text-gray-500">
            <span>
              {formatFullDate(firstDate)} – {formatFullDate(lastDate)}
            </span>
            {periodChange != null && (
              <span className={`font-semibold ${TREND_TEXT[getTrend(periodChange)]}`}>
                {formatPercent(periodChange)} no período
              </span>
            )}
          </div>
        )}

        {historyLoading ? (
          <SkeletonCard height="h-56" />
        ) : historyError ? (
          <p className="py-10 text-center text-sm text-red-600">{historyError}</p>
        ) : visible.length < 2 ? (
          <p className="py-10 text-center text-sm text-gray-500">
            Histórico indisponível para este período.
          </p>
        ) : (
          <div className="h-56 w-full">
            <StockPriceChart data={visible} color={chartColor} />
          </div>
        )}

        {limitedHistory && (
          <p className="mt-2 text-xs text-gray-400">
            Histórico disponível apenas a partir de {formatFullDate(firstDate)}.
          </p>
        )}
        {hasLockedPeriod && (
          <p className="mt-1 text-xs text-gray-400">
            Períodos maiores exigem um plano pago da brapi.
          </p>
        )}
      </div>

      {/* Indicadores */}
      <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-lg bg-gray-50 px-3 py-2">
            <dt className="text-xs text-gray-500">{label}</dt>
            <dd className="text-sm font-semibold text-gray-800">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}