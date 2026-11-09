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