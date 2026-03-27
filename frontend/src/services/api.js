import axios from 'axios';

const normalizeApiBaseUrl = (url) => {
  const trimmed = (url || '').replace(/\/+$/, '');
  if (!trimmed) {
    return 'http://localhost:5000/api';
  }
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

const API_BASE_URL = normalizeApiBaseUrl(process.env.REACT_APP_API_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

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
  (error) => {
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
