import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8080/api',
});

//interceptor para rodar antes das chamadas
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');

    if(token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

//interceptor para rodar depois das respostas da chamada
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRoute = error.config?.url?.includes('/auth/');

    if (error.response?.status === 401 && isAuthRoute) {
      localStorage.removeItem('token');
      window.location.href = '/login?expired=true';
    }

    return Promise.reject(error);
  }
);

export default api;
