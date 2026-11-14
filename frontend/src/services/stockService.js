import axios from 'axios';
import { isValidTicker, normalizeTicker, planLimit } from '../utils/stockUtils';

// A brapi é uma API EXTERNA. Por isso ela tem a sua própria instância do Axios:
// a instância de api.js anexaria o JWT do MyPiggy a um site de terceiros e
// redirecionaria para o login em qualquer 401.
//
// Atenção: variáveis VITE_* vão para o bundle do navegador (qualquer um que abrir o
// site consegue ver o token). Para o TCC rodando local isso é aceitável; em produção
// a chamada deveria passar pelo back-end.
const token = import.meta.env.VITE_BRAPI_TOKEN;

const brapi = axios.create({
  baseURL: 'https://brapi.dev/api/v2',
  timeout: 15000,
  headers: token ? { Authorization: `Bearer ${token}` } : undefined,
});

/* ------------------------------------------------------------------ */
/* Cache em memória (60 s)                                             */
/* ------------------------------------------------------------------ */
// O plano gratuito limita as requisições por mês e aceita 1 ticker por chamada.
// O cache evita repetir a mesma consulta ao alternar entre ativos.

const CACHE_TTL_MS = 60 * 1000;
const HISTORY_TTL_MS = 10 * 60 * 1000; // histórico diário muda pouco: cache mais longo
const cache = new Map();

async function cached(key, loader, ttl = CACHE_TTL_MS) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < ttl) return hit.value;

  const value = await loader();
  cache.set(key, { at: Date.now(), value });
  return value;
}

export function clearStockCache() {
  cache.clear();
}

/* ------------------------------------------------------------------ */
/* Requisição + tradução de erros                                      */
/* ------------------------------------------------------------------ */

function toFriendlyError(error) {
  const status = error.response?.status;
  let message;

  if (!error.response) {
    message = 'Não foi possível conectar à brapi. Verifique sua conexão.';
  } else if (status === 401) {
    message =
      'Token da brapi ausente ou inválido. Sem token, só alguns tickers de teste funcionam (PETR4, VALE3...). Configure VITE_BRAPI_TOKEN no .env.local.';
  } else if (status === 403) {
    message = 'O plano da brapi não inclui este recurso.';
  } else if (status === 404) {
    message = 'Ticker não encontrado.';
  } else if (status === 429) {
    message = 'Limite de requisições da brapi excedido. Tente novamente mais tarde.';
  } else {
    message = error.response?.data?.message || 'Erro ao consultar a brapi.';
  }

  const friendly = new Error(message);
  friendly.status = status;
  return friendly;
}

async function request(path, params) {
  try {
    const response = await brapi.get(path, { params });
    return response.data;
  } catch (error) {
    throw toFriendlyError(error);
  }
}

function assertTicker(rawSymbol) {
  const symbol = normalizeTicker(rawSymbol);
  if (!isValidTicker(symbol)) {
    throw new Error('Informe um ticker válido, como PETR4 ou VALE3.');
  }
  return symbol;
}

/* ------------------------------------------------------------------ */
/* Cotação                                                             */
/* ------------------------------------------------------------------ */

/**
 * Cotação atual de um ticker (GET /v2/stocks/quote).
 * Os preços vêm em REAIS (não em centavos); a conversão acontece na exibição.
 */
export async function getQuote(rawSymbol) {
  const symbol = assertTicker(rawSymbol);

  return cached(`quote:${symbol}`, async () => {
    const data = await request('/stocks/quote', { symbols: symbol });
    const item = data?.results?.[0];

    if (!item?.data) {
      const notFound = new Error('Ticker não encontrado.');
      notFound.status = 404;
      throw notFound;
    }

    const d = item.data;
    return {
      symbol: item.symbol,
      name: d.longName || d.shortName || item.symbol,
      shortName: d.shortName,
      currency: d.currency,
      price: d.regularMarketPrice,
      change: d.regularMarketChange,
      changePercent: d.regularMarketChangePercent,
      open: d.regularMarketOpen,
      previousClose: d.regularMarketPreviousClose,
      dayHigh: d.regularMarketDayHigh,
      dayLow: d.regularMarketDayLow,
      volume: d.regularMarketVolume,
      marketCap: d.marketCap,
      yearLow: d.fiftyTwoWeekLow,
      yearHigh: d.fiftyTwoWeekHigh,
      logoUrl: d.logourl,
      updatedAt: d.regularMarketTime,
    };
  });
}

/* ------------------------------------------------------------------ */
/* Histórico                                                           */
/* ------------------------------------------------------------------ */

/**
 * Histórico diário de um ticker (GET /v2/stocks/historical), em ordem crescente de data.
 *
 * Faz UMA requisição, com o maior intervalo que o plano permite (VITE_BRAPI_PLAN:
 * free = 3 meses, startup = 1 ano, pro = tudo). Os períodos 1S/1M/3M/1A/Tudo são
 * recortes feitos no front (sliceByPeriod), então trocar de período não gasta requisição.
 * Datas em segundos Unix; preços em reais.
 */
export async function getHistory(rawSymbol) {
  const symbol = assertTicker(rawSymbol);

  return cached(
    `history:${symbol}:${planLimit.range}`,
    async () => {
      const data = await request('/stocks/historical', {
        symbols: symbol,
        range: planLimit.range,
        interval: '1d',
        sortOrder: 'asc',
      });

      const candles = data?.results?.[0]?.data?.historicalDataPrice ?? [];

      return candles
        .filter((candle) => candle.close != null)
        .sort((a, b) => a.date - b.date) // não depende da ordem que a API devolveu
        .map((candle) => ({
          date: candle.date,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          volume: candle.volume,
        }));
    },
    HISTORY_TTL_MS
  );
}

/* ------------------------------------------------------------------ */
/* Busca (autocomplete)                                                */
/* ------------------------------------------------------------------ */

/**
 * Procura ações por parte do ticker ou do nome da empresa (GET /v2/tickers).
 */
export async function searchTickers(term) {
  const search = String(term ?? '').trim();
  if (search.length < 2) return [];

  return cached(`search:${search.toUpperCase()}`, async () => {
    const data = await request('/tickers', { search, type: 'stock', limit: 6 });

    return (data?.results ?? []).map((ticker) => ({
      symbol: ticker.symbol,
      name: ticker.name || ticker.longName,
      logoUrl: ticker.logoUrl,
      price: ticker.quote?.lastPrice,
      changePercent: ticker.quote?.changePercent,
    }));
  });
}

/* ------------------------------------------------------------------ */
/* Principais ações (lista + faixa rolante) — 1 requisição para todas   */
/* ------------------------------------------------------------------ */
// O endpoint /tickers devolve preço e variação de VÁRIOS ativos numa única chamada
// (campo "quote"). Em vez de consultar 12 tickers um a um (12 requisições no plano
// gratuito), pedimos as mais negociadas de uma vez e guardamos no localStorage por
// 10 minutos: recarregar a página ou voltar à tela não gasta requisição.

const TOP_KEY = 'mypiggy:top-stocks';
const TOP_TTL_MS = 10 * 60 * 1000;
const TOP_SIZE = 12;
const STANDARD_TICKER = /^[A-Z]{4}\d{1,2}$/; // descarta fracionárias (PETR4F) e códigos atípicos

let topInFlight = null; // evita 2 chamadas simultâneas (ex.: StrictMode em desenvolvimento)

function readTopCache() {
  try {
    const raw = localStorage.getItem(TOP_KEY);
    if (!raw) return null;
    const { at, data } = JSON.parse(raw);
    if (Date.now() - at < TOP_TTL_MS && Array.isArray(data) && data.length > 0) return data;
  } catch {
    // cache corrompido ou indisponível: segue para a API
  }
  return null;
}

function writeTopCache(data) {
  try {
    localStorage.setItem(TOP_KEY, JSON.stringify({ at: Date.now(), data }));
  } catch {
    // sem espaço ou bloqueado: apenas não guarda
  }
}

/**
 * As ações mais negociadas da B3 (com preço e variação do dia), numa única requisição.
 * @returns {Promise<Array<{symbol, name, logoUrl, price, changePercent}>>}
 */
export async function getTopStocks() {
  const stored = readTopCache();
  if (stored) return stored;

  if (!topInFlight) {
    topInFlight = request('/tickers', {
      type: 'stock',
      sortBy: 'volume',
      sortOrder: 'desc',
      limit: 30, // margem: parte dos resultados é descartada pelo filtro abaixo
    })
      .then((data) => {
        const list = (data?.results ?? [])
          .filter((ticker) => STANDARD_TICKER.test(ticker.symbol) && ticker.quote?.lastPrice != null)
          .slice(0, TOP_SIZE)
          .map((ticker) => ({
            symbol: ticker.symbol,
            name: ticker.name || ticker.longName,
            logoUrl: ticker.logoUrl,
            price: ticker.quote.lastPrice,
            changePercent: ticker.quote.changePercent,
          }));

        if (list.length > 0) writeTopCache(list);
        return list;
      })
      .finally(() => {
        topInFlight = null;
      });
  }

  return topInFlight;
}