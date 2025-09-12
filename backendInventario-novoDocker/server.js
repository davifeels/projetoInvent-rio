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

// --- Configuração de Segurança (CORS e Helmet) ---
const corsOptions = {
  origin: [
    'http://localhost:3001',       // frontend local
    'http://172.19.0.2:3000',      // backend docker/local network
    process.env.CORS_ORIGIN        // URL adicional em produção
  ].filter(Boolean),
  credentials: true,              // permite cookies e headers de autenticação
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
};

// Aplica CORS e Helmet
app.use(cors(corsOptions));
app.use(helmet());

// --- Middlewares para processar JSON e URL-encoded ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Middleware para responder preflight OPTIONS em todas as rotas ---
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.sendStatus(204); // sem conteúdo
  } else {
    next();
  }
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

// Rotas públicas
app.use('/api/auth', authRoutes);
app.use('/api/funcoes', funcoesRoutes);
app.use('/api/setores', setoresRoutes);

// Rotas privadas (autenticação + perfil)
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
  res.status(404).json({ message: 'Endpoint não encontrado.' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Ocorreu um erro interno no servidor.' });
});

// =================================================================
//                      INICIALIZAÇÃO DO SERVIDOR
// =================================================================
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor backend rodando na porta ${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Porta ${PORT} já está em uso. Finalize o processo ou use outra porta.`);
    process.exit(1);
  } else {
    throw err;
  }
});
