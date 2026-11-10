import api from './api';

// O backend responde sempre no formato { status, message, data }.
// O Axios já coloca o corpo em response.data, então o payload real fica em response.data.data.

/**
 * Gastos (DEBIT) ou receitas (CREDIT) agrupados por categoria em um mês.
 * @param {string} month  formato "YYYY-MM"
 * @param {'DEBIT'|'CREDIT'} type
 */
export async function getByCategory(month, type = 'DEBIT') {
  const response = await api.get('/reports/by-category', {
    params: { month, type },
  });
  return response.data.data;
}

/**
 * Receitas e despesas dos últimos N meses (o backend aceita de 1 a 24).
 * @param {number} months
 */
export async function getMonthly(months = 6) {
  const response = await api.get('/reports/monthly', {
    params: { months },
  });
  return response.data.data;
}

/* ------------------------------------------------------------------ */
/* Exportação                                                          */
/* ------------------------------------------------------------------ */

// Com responseType 'blob', até a resposta de ERRO chega como Blob (e não como objeto).
// Por isso lemos o blob como texto e extraímos o "message" que o backend enviou.
async function extractErrorMessage(error) {
  if (!error.response) {
    return 'Não foi possível conectar ao servidor.';
  }

  const data = error.response.data;
  if (data instanceof Blob) {
    try {
      const json = JSON.parse(await data.text());
      if (json.message) return json.message;
    } catch {
      // corpo não era JSON: cai na mensagem genérica abaixo
    }
  }
  return 'Não foi possível gerar o arquivo.';
}

// Monta os parâmetros da requisição. Listas viram texto separado por vírgula
// ("CREDIT,DEBIT"), que o Spring converte em List sozinho. Lista vazia = não envia = sem filtro.
function buildExportParams(startDate, endDate, { types = [], categoryIds = [], accountIds = [] } = {}) {
  const params = { startDate, endDate }; // "YYYY-MM-DD", o formato que o backend espera
  if (types.length) params.types = types.join(',');
  if (categoryIds.length) params.categoryIds = categoryIds.join(',');
  if (accountIds.length) params.accountIds = accountIds.join(',');
  return params;
}

async function downloadReport(path, startDate, endDate, filters) {
  try {
    const response = await api.get(path, {
      params: buildExportParams(startDate, endDate, filters),
      responseType: 'blob',
    });
    return response.data; // Blob
  } catch (error) {
    throw new Error(await extractErrorMessage(error));
  }
}

/**
 * Extrato do período em CSV.
 * @param {string} startDate "YYYY-MM-DD"
 * @param {string} endDate   "YYYY-MM-DD"
 * @param {{types?: string[], categoryIds?: number[], accountIds?: string[]}} [filters]
 * @returns {Promise<Blob>}
 */
export function exportCsv(startDate, endDate, filters) {
  return downloadReport('/reports/export/csv', startDate, endDate, filters);
}

/**
 * Relatório do período em PDF (mesmos parâmetros do CSV).
 * @returns {Promise<Blob>}
 */
export function exportPdf(startDate, endDate, filters) {
  return downloadReport('/reports/export/pdf', startDate, endDate, filters);
}