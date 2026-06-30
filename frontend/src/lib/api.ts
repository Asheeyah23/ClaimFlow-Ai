import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - attach JWT
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('claimflow_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('claimflow_token');
      localStorage.removeItem('claimflow_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: { name: string; email: string; password: string; role?: string }) =>
    api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
};

// Claims
export const claimsAPI = {
  getAll: (params?: Record<string, string | number>) =>
    api.get('/claims', { params }),
  getById: (id: string) => api.get(`/claims/${id}`),
  create: (data: Record<string, unknown>) => api.post('/claims', data),
  updateStatus: (id: string, data: { status: string; approved_amount?: number; notes?: string }) =>
    api.patch(`/claims/${id}/status`, data),
  reAnalyze: (id: string) => api.post(`/claims/${id}/analyze`),
  getDashboardStats: () => api.get('/claims/stats/dashboard'),
};

// Policyholders
export const policyholdersAPI = {
  getAll: (params?: Record<string, string | number>) =>
    api.get('/policyholders', { params }),
  getById: (id: string) => api.get(`/policyholders/${id}`),
  create: (data: Record<string, unknown>) => api.post('/policyholders', data),
};

export default api;
