import axios from 'axios';

// ✅ URL do backend (PORTA CORRETA 3000)
const API_BASE_URL = 'http://localhost:3000/api';

// ✅ Basename da aplicação (removido pois não estamos usando mais)
const APP_BASENAME = '';

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
  // '/setores' e '/funcoes' apenas GET podem ser públicos
  // POST, PUT, DELETE devem exigir autenticação
];

// ✅ Verifica se a rota é pública
const isPublicRoute = (url, method) => {
  // Rotas completamente públicas
  if (PUBLIC_ROUTES.some(route => url.includes(route))) {
    return true;
  }
  
  // GET em /setores e /funcoes é público (para listar)
  // Mas POST, PUT, DELETE requerem autenticação
  if (method === 'GET' && (url.includes('/setores') || url.includes('/funcoes'))) {
    return true;
  }
  
  return false;
};

// ✅ INTERCEPTOR: Adiciona token antes de enviar requisição
api.interceptors.request.use(
  (config) => {
    // Se não for rota pública, adiciona o token
    if (!isPublicRoute(config.url)) {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        console.warn('⚠️ Token não encontrado para rota protegida:', config.url);
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
      if (status === 401 || status === 431) {
        console.warn('⚠️ Sessão expirada. Redirecionando para login...');
        
        // 🔥 LIMPA APENAS O QUE EXISTE
        localStorage.removeItem('accessToken');
        
        // 🔥 Redireciona RESPEITANDO o basename
        const loginPath = `${APP_BASENAME}/login`;
        if (window.location.pathname !== loginPath) {
          window.location.href = loginPath;
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