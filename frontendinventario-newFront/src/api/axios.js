import axios from 'axios';

// ✅ URL do backend
const API_BASE_URL = 'http://localhost:3000/api';

// ✅ Cria instância do axios com configurações
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // 🔥 CRÍTICO PARA CORS
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 segundos
});

// ✅ Rotas públicas (não precisam de token)
const PUBLIC_ROUTES = [
  '/auth/login',
  '/auth/solicitar-acesso',
  '/setores',
  '/funcoes',
];

// ✅ Verifica se a rota é pública
const isPublicRoute = (url) => {
  return PUBLIC_ROUTES.some(route => url.includes(route));
};

// ✅ INTERCEPTOR: Adiciona token antes de enviar requisição
api.interceptors.request.use(
  (config) => {
    // Se não for rota pública, adiciona o token
    if (!isPublicRoute(config.url)) {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    // 📝 LOG de debug (pode remover em produção)
    console.log(`📤 ${config.method.toUpperCase()} ${config.url}`);

    return config;
  },
  (error) => {
    console.error('❌ Erro no request:', error);
    return Promise.reject(error);
  }
);

// ✅ INTERCEPTOR: Trata respostas e erros
api.interceptors.response.use(
  (response) => {
    // 📝 LOG de sucesso (pode remover em produção)
    console.log(`✅ ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    // Trata diferentes tipos de erro
    if (error.response) {
      // Servidor respondeu com erro
      const { status, data } = error.response;

      console.error(`❌ Erro ${status}:`, data);

      // Token inválido ou expirado
      if (status === 401) {
        console.warn('⚠️ Sessão expirada. Redirecionando para login...');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('usuario');
        
        // Redireciona para login (ajuste conforme seu router)
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }

      // Sem permissão
      if (status === 403) {
        console.warn('⚠️ Sem permissão para esta ação');
      }

    } else if (error.request) {
      // Request foi enviado mas sem resposta
      console.error('❌ Servidor não respondeu:', error.request);
    } else {
      // Erro ao configurar o request
      console.error('❌ Erro na configuração:', error.message);
    }

    return Promise.reject(error);
  }
);

export default api;