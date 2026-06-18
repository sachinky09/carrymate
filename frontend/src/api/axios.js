import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('carrymate_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config ? `${error.config.method?.toUpperCase()} ${error.config.url}` : 'unknown request';
    const serverMessage = error.response?.data?.error;
    console.error(`[ERROR] file=src/api/axios.js request=${url} message=${serverMessage || error.message}`);
    return Promise.reject(error);
  }
);

export default api;
