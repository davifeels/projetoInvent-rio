import axios from 'axios';

// URL do seu backend
const API_BASE_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Rotas públicas (não precisam de token)
const PUBLIC_ROUTES = [
  { path: '/auth/login', method: 'post' },
  { path: '/auth/solicitar-acesso', method: 'post' },
  { path: '/setores', method: 'get' },
  { path: '/funcoes', method: 'get' },
];

api.interceptors.request.use(
  (config) => {
    const isPublicRoute = PUBLIC_ROUTES.some(route =>
      config.url.endsWith(route.path) && config.method.toLowerCase() === route.method.toLowerCase()
    );

    if (!isPublicRoute) {
      const token = localStorage.getItem('accessToken'); // pega token do login
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
