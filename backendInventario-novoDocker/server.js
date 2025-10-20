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

// ✅ CORS SUPER SIMPLIFICADO - APENAS LOCALHOST:3001
const corsOptions = {
  origin: 'http://localhost:3001', // 🔥 APENAS UMA URL
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Disposition'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// ✅ HELMET (mais permissivo)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "unsafe-none" }
}));

// ✅ AUMENTA O LIMITE DE HEADERS E BODY
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb', parameterLimit: 50000 }));

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
    cors: 'enabled for http://localhost:3001'
  });
});

// ✅ LOGGING DE REQUISIÇÕES
app.use((req, res, next) => {
  console.log(`🔥 ${req.method} ${req.path} - Origin: ${req.headers.origin || 'sem origin'}`);
  next();
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

app.use((err, req, res, next) => {
  console.error('❌ Erro capturado:', err);
  
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
  console.log(`🚀 CORS habilitado APENAS para: http://localhost:3001`);
  console.log('🚀 ====================================\n');
});

// ✅ REMOVE LIMITE DE HEADERS
server.maxHeadersCount = 0;

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