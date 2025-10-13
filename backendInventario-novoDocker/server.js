// =================================================================
//                      CONFIGURAÇÃO E DEPENDÊNCIAS
// =================================================================
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const app = express();
const dbPool = require('./config/db');

// =================================================================
//                      CONEXÃO COM O BANCO DE DADOS
// =================================================================
dbPool.getConnection()
  .then(connection => {
    console.log('✅ Conexão com o MySQL estabelecida com sucesso!');
    connection.release();
  })
  .catch(err => {
    console.error('❌ ERRO CRÍTICO: Falha na conexão com o MySQL:', err);
    process.exit(1);
  });

// =================================================================
//                              MIDDLEWARES
// =================================================================

// ✅ CORREÇÃO COMPLETA DO CORS
const allowedOrigins = [
  'http://localhost:3000',        // React local
  'http://localhost:3001',        // Frontend alternativo
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://172.19.0.2:3000',
  'http://10.0.11.88:3001',
  process.env.CORS_ORIGIN,        // Produção
  process.env.FRONTEND_URL        // Extra
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Permite requisições sem origin (Postman, mobile apps, etc)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`⚠️ Origem bloqueada pelo CORS: ${origin}`);
      callback(new Error('Não permitido pelo CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  exposedHeaders: ['Content-Disposition'], // Para download de Excel
  optionsSuccessStatus: 200,
  preflightContinue: false
};

// Aplica CORS ANTES de tudo
app.use(cors(corsOptions));

// ✅ ADICIONA HELMET DEPOIS DO CORS
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }
}));

// Parse JSON e URL-encoded
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ✅ LOGGING DE REQUISIÇÕES (útil para debug)
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path} - Origin: ${req.headers.origin || 'sem origin'}`);
  next();
});

// =================================================================
//                                 ROTAS
// =================================================================
const autenticarToken = require('./middlewares/authMiddleware');

const authRoutes = require('./routes/auth');
const funcoesRoutes = require('./routes/funcoes');
const setoresRoutes = require('./routes/setores');
const usuarioRoutes = require('./routes/usuarios');
const cadastroRoutes = require('./routes/cadastros');
const inventarioRoutes = require('./routes/inventario');
const auditoriaRoutes = require('./routes/auditoria');
const inventarioLgpdRoutes = require('./routes/inventarioLgpd');
const adminRoutes = require('./routes/admin');

// ✅ ROTA DE HEALTH CHECK
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    cors: 'enabled'
  });
});

// Rotas públicas (SEM autenticação)
app.use('/api/auth', authRoutes);
app.use('/api/funcoes', funcoesRoutes);
app.use('/api/setores', setoresRoutes);

// Rotas privadas (COM autenticação)
app.use('/api/usuarios', autenticarToken, usuarioRoutes);
app.use('/api/cadastros', autenticarToken, cadastroRoutes);
app.use('/api/inventario', autenticarToken, inventarioRoutes);
app.use('/api/auditoria', autenticarToken, auditoriaRoutes);
app.use('/api/inventario-pessoal', autenticarToken, inventarioLgpdRoutes);
app.use('/api/admin', autenticarToken, adminRoutes);

// =================================================================
//                      TRATAMENTO DE ERROS E 404
// =================================================================
app.use((req, res, next) => {
  res.status(404).json({ 
    success: false,
    message: 'Endpoint não encontrado.',
    path: req.path 
  });
});

// ✅ HANDLER DE ERROS MELHORADO
app.use((err, req, res, next) => {
  console.error('❌ Erro capturado:', err);
  
  // Erro de CORS
  if (err.message === 'Não permitido pelo CORS') {
    return res.status(403).json({ 
      success: false,
      message: 'Origem não permitida pelo CORS',
      origin: req.headers.origin 
    });
  }
  
  res.status(err.status || 500).json({ 
    success: false,
    message: err.message || 'Erro interno no servidor.',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// =================================================================
//                      INICIALIZAÇÃO DO SERVIDOR
// =================================================================
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('\n🚀 ====================================');
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`🚀 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🚀 CORS habilitado para:`);
  allowedOrigins.forEach(origin => console.log(`   - ${origin}`));
  console.log('🚀 ====================================\n');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Porta ${PORT} já está em uso.`);
    process.exit(1);
  } else {
    throw err;
  }
});

// ✅ GRACEFUL SHUTDOWN
process.on('SIGTERM', () => {
  console.log('⚠️ SIGTERM recebido, fechando servidor...');
  server.close(() => {
    console.log('✅ Servidor fechado com sucesso');
    process.exit(0);
  });
});