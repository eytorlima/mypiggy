import api from './api';

export async function getSettings() {
  const response = await api.get('/users/settings');
  return response.data.data;
}

export async function updateSettings(data) {
  const response = await api.put('/users/settings', data);
  return response.data.data;
}

// Atualiza nome e/ou senha. Devolve { id, name, email }
export async function updateProfile(data) {
  const response = await api.put('/users/profile', data);
  return response.data.data;
}