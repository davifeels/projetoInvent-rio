import axios from 'axios';

// REVERTIDO: Voltamos para a URL completa que já funcionava no seu ambiente.
const API_BASE_URL = 'http://10.0.11.88:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

const PUBLIC_ROUTES = [
  { path: '/auth/login', method: 'post' },
  { path: '/auth/solicitar-acesso', method: 'post' },
  { path: '/setores', method: 'get' },
  { path: '/funcoes', method: 'get' },
];

api.interceptors.request.use(
  (config) => {
    const isPublicRoute = PUBLIC_ROUTES.some(route =>
      config.url.endsWith(route.path) && config.method === route.method
    );

    if (!isPublicRoute) {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;