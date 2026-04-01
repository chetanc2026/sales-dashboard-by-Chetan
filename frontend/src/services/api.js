import axios from 'axios';

const getDefaultApiBaseUrl = () => {
  if (typeof window !== 'undefined' && window.location?.hostname?.includes('vercel.app')) {
    return 'https://sales-api-4f7h.onrender.com/api';
  }
  return 'http://localhost:5000/api';
};

const normalizeApiBaseUrl = (url) => {
  const trimmed = (url || '').replace(/\/+$/, '');
  if (!trimmed) {
    return getDefaultApiBaseUrl();
  }
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

const API_BASE_URL = normalizeApiBaseUrl(process.env.REACT_APP_API_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config || {};
    const method = (config.method || '').toLowerCase();
    const status = error.response?.status;
    const isTimeoutOrNetwork = error.code === 'ECONNABORTED' || !error.response;
    const shouldRetry = method === 'get' && !config.__retried && (isTimeoutOrNetwork || status >= 500);

    if (shouldRetry) {
      config.__retried = true;
      await sleep(800);
      return api(config);
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
};

export const dataAPI = {
  getSchema: () => api.get('/data/schema'),
  uploadFile: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/data/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getUploads: () => api.get('/data/uploads'),
};

export const dashboardAPI = {
  getKPIs: (filters) => api.get('/dashboard/kpis', { params: filters }),
  getRegionSales: (filters) => api.get('/dashboard/region-sales', { params: filters }),
  getProductPerformance: (filters) => api.get('/dashboard/product-performance', { params: filters }),
  getTrends: (filters) => api.get('/dashboard/trends', { params: filters }),
  getGeoHeatmap: (filters) => api.get('/dashboard/geo-heatmap', { params: filters }),
  getInsights: (filters) => api.get('/dashboard/insights', { params: filters }),
  getData: (filters) => api.get('/dashboard/data', { params: filters }),
};

export default api;
