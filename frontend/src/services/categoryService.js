import api from './api';

export async function getCategories() {
  const response = await api.get('/categories');
  return response.data.data;
}