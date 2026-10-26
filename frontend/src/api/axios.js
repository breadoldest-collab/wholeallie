import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
});

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

API.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
    const isPublicRoute = ['/', '/landing', '/login', '/register'].includes(pathname) || pathname.startsWith('/support/');

    if ((status === 401 || status === 403) && !isPublicRoute) {
      localStorage.removeItem('token');
      localStorage.removeItem('businessId');
      localStorage.removeItem('businessName');
      localStorage.removeItem('userEmail');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default API;