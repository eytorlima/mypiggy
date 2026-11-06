import api from "./api";
// Remove filtros vazios: o axios enviaria "?type=" e o back-end
// tentaria converter a string vazia para UUID/Integer/LocalDateTime
function cleanParams(filters) {
  return Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) => value !== undefined && value !== null && value !== ''
    )
  );
}

// filters: { accountId, type, categoryId, startDate, endDate }
export async function getTransactions(filters = {}) {
  const response = await api.get('/transactions', {
    params: cleanParams(filters),
  });
  return response.data.data;
}

export async function createTransaction(data) {
  const response = await api.post('/transactions', data);
  return response.data.data;
}

export async function updateTransaction(id, data) {
  const response = await api.put(`/transactions/${id}`, data);
  return response.data.data;
}

export async function deleteTransaction(id) {
  await api.delete(`/transactions/${id}`);
}

export async function getMonthlySummary() {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const response = await api.get(`/transactions/summary?month=${month}&year=${year}`);

    return response.data.data;
}