import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = 'https://igaa.onrender.com/api/v1';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('bank_access_token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Don't override Content-Type for FormData (file uploads)
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('bank_access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
