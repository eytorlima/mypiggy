import { formatBRL } from './formatCurrency';

// Lista de reserva da tela de Ações (usada só se a consulta com preços falhar)
export const FALLBACK_TOP_TICKERS = [
  'PETR4', 'VALE3', 'ITUB4', 'BBDC4', 'BBAS3', 'ABEV3',
  'WEGE3', 'B3SA3', 'MGLU3', 'RENT3', 'SUZB3', 'ITSA4',
];

// Ações e units da B3: 4 letras + 1 ou 2 dígitos (PETR4, TAEE11). Aceita 4 a 7 caracteres.
const TICKER_REGEX = /^[A-Z0-9]{4,7}$/;

export function normalizeTicker(value) {
  return String(value ?? '').trim().toUpperCase();
}

export function isValidTicker(value) {
  return TICKER_REGEX.test(normalizeTicker(value));
}

/* ------------------------------------------------------------------ */
/* Valores                                                             */
/* ------------------------------------------------------------------ */

// A brapi devolve preços em reais (ex.: 36.65). O projeto formata dinheiro a partir de
// centavos, então convertemos na borda e reaproveitamos o formatBRL.
export function toCents(valueInReais) {
  return Math.round(valueInReais * 100);
}

export function formatStockPrice(valueInReais) {
  if (valueInReais == null || Number.isNaN(valueInReais)) return '—';
  return formatBRL(toCents(valueInReais));
}

// "+0,35" / "-1,20" / "0,00"
export function formatSigned(value, digits = 2) {
  if (value == null || Number.isNaN(value)) return '—';
  const text = Math.abs(value).toLocaleString('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  if (value > 0) return `+${text}`;
  if (value < 0) return `-${text}`;
  return text;
}

export function formatPercent(value) {
  const text = formatSigned(value);
  return text === '—' ? text : `${text}%`;
}

// 27681100 -> "27,7 mi"
export function formatCompact(value) {
  if (value == null || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat('pt-BR', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

export function getTrend(value) {
  if (value > 0) return 'up';
  if (value < 0) return 'down';
  return 'flat';
}

/* ------------------------------------------------------------------ */
/* Datas                                                               */
/* ------------------------------------------------------------------ */

const TIME_ZONE = 'America/Sao_Paulo';

export function formatDateTime(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TIME_ZONE,
  });
}

// Data em segundos Unix (como vem no histórico) -> "12/06"
export function formatDayLabel(unixSeconds) {
  return new Date(unixSeconds * 1000).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    timeZone: TIME_ZONE,
  });
}

// "12/06/2026"
export function formatFullDate(unixSeconds) {
  return new Date(unixSeconds * 1000).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: TIME_ZONE,
  });
}

// Rótulo do eixo X: "12/06" em períodos curtos, "06/26" (mês/ano) em períodos longos
export function formatAxisDate(unixSeconds, long) {
  return new Date(unixSeconds * 1000).toLocaleDateString(
    'pt-BR',
    long
      ? { month: '2-digit', year: '2-digit', timeZone: TIME_ZONE }
      : { day: '2-digit', month: '2-digit', timeZone: TIME_ZONE }
  );
}

/* ------------------------------------------------------------------ */
/* Períodos do gráfico                                                 */
/* ------------------------------------------------------------------ */
// A API cobra uma requisição por consulta, então o histórico é buscado UMA vez, no
// maior intervalo que o plano permite, e cada período é só um recorte feito aqui no
// front: trocar de 1S para 1M para 3M não gasta nenhuma requisição.

export const PERIODS = [
  { key: '1S', label: '1S', days: 7, title: '1 semana' },
  { key: '1M', label: '1M', days: 30, title: '1 mês' },
  { key: '3M', label: '3M', days: 90, title: '3 meses' },
  { key: '1A', label: '1A', days: 365, title: '1 ano' },
  { key: 'MAX', label: 'Tudo', days: null, title: 'Todo o período' },
];

// Plano da brapi, informado em VITE_BRAPI_PLAN (free | startup | pro). Padrão: free.
// Define quanto histórico a API entrega: gratuito 3 meses, Startup 1 ano, Pro completo.
const PLAN_LIMITS = {
  free: { range: '3mo', maxDays: 92 },
  startup: { range: '1y', maxDays: 366 },
  pro: { range: 'max', maxDays: Infinity },
};

const planName = String(import.meta.env.VITE_BRAPI_PLAN || 'free').toLowerCase();

export const planLimit = PLAN_LIMITS[planName] ?? PLAN_LIMITS.free;

export function isPeriodAvailable(period) {
  if (period.days == null) return planLimit.maxDays === Infinity; // "Tudo" só no Pro
  return period.days <= planLimit.maxDays;
}

// Mensagem do botão desabilitado
export function periodRequirement(period) {
  return period.days != null && period.days <= PLAN_LIMITS.startup.maxDays
    ? 'Requer plano Startup ou superior da brapi'
    : 'Requer plano Pro da brapi';
}

// Reduz séries muito longas (ex.: 20 anos diários) para ~250 pontos, mantendo o primeiro
// e o último, para o gráfico continuar leve.
export function downsample(points, max = 250) {
  if (points.length <= max) return points;
  const step = (points.length - 1) / (max - 1);
  return Array.from({ length: max }, (_, index) => points[Math.round(index * step)]);
}

// Recorta o histórico (ordem crescente) para o período escolhido, contando a partir do
// último pregão disponível.
export function sliceByPeriod(history, periodKey) {
  const period = PERIODS.find((item) => item.key === periodKey) ?? PERIODS[0];
  if (history.length === 0) return [];
  if (period.days == null) return downsample(history);

  const cutoff = history[history.length - 1].date - period.days * 86400;
  return downsample(history.filter((candle) => candle.date >= cutoff));
}