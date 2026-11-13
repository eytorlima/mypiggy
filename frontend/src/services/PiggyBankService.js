import api from './api';

// O backend responde sempre no formato { status, message, data }.
// O payload real fica em response.data.data.

export async function getPiggyBanks() {
  const response = await api.get('/piggybanks');
  return response.data.data;
}

export async function createPiggyBank(data) {
  const response = await api.post('/piggybanks', data);
  return response.data.data;
}

export async function updatePiggyBank(id, data) {
  const response = await api.put(`/piggybanks/${id}`, data);
  return response.data.data;
}

// Se o porquinho tiver dinheiro, returnAccountId é a conta que recebe o valor
export async function deletePiggyBank(id, returnAccountId) {
  await api.delete(`/piggybanks/${id}`, {
    params: returnAccountId ? { returnAccountId } : undefined,
  });
}

// Guardar: o dinheiro sai da conta (accountId) e entra no porquinho.
// Devolve o porquinho já atualizado (saldo, rendimento e progresso).
export async function depositToPiggyBank(id, { accountId, amountInCents }) {
  const response = await api.post(`/piggybanks/${id}/deposit`, { accountId, amountInCents });
  return response.data.data;
}

// Retirar: o dinheiro sai do porquinho e volta para a conta (accountId)
export async function withdrawFromPiggyBank(id, { accountId, amountInCents }) {
  const response = await api.post(`/piggybanks/${id}/withdraw`, { accountId, amountInCents });
  return response.data.data;
}

export async function getPiggyBankMovements(id) {
  const response = await api.get(`/piggybanks/${id}/movements`);
  return response.data.data;
}