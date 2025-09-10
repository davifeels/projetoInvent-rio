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
//                            MIDDLEWARES
// =================================================================

// --- Configuração de Segurança (CORS e Helmet) ---
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
};
app.use(cors(corsOptions));
app.use(helmet());

// --- Middlewares para processamento do corpo da requisição ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =================================================================
//                                 ROTAS
// =================================================================

// --- Middleware de Autenticação (será usado por rota) ---
const autenticarToken = require('./middlewares/authMiddleware');

// --- Definição das Rotas ---
const authRoutes = require('./routes/auth');
const funcoesRoutes = require('./routes/funcoes');
const setoresRoutes = require('./routes/setores'); // Rota unificada de setores
const usuarioRoutes = require('./routes/usuarios');
const cadastroRoutes = require('./routes/cadastros');
const inventarioRoutes = require('./routes/inventario');
const auditoriaRoutes = require('./routes/auditoria');
const inventarioLgpdRoutes = require('./routes/inventarioLgpd');
const adminRoutes = require('./routes/admin');

// --- Aplicação das Rotas ---

// Rotas que são total ou parcialmente públicas
app.use('/api/auth', authRoutes);
app.use('/api/funcoes', funcoesRoutes);
app.use('/api/setores', setoresRoutes); // Agora unificada. A própria rota decide o que é público/privado.

// Rotas que são 100% privadas (note o 'autenticarToken' antes de cada uma)
app.use('/api/usuarios', autenticarToken, usuarioRoutes);
app.use('/api/cadastros', autenticarToken, cadastroRoutes);
app.use('/api/inventario', autenticarToken, inventarioRoutes);
app.use('/api/auditoria', autenticarToken, auditoriaRoutes);
app.use('/api/inventario-pessoal', autenticarToken, inventarioLgpdRoutes);
app.use('/api/admin', autenticarToken, adminRoutes);

// =================================================================
//                      TRATAMENTO DE ERROS E 404
// =================================================================

// --- Handler para rotas não encontradas (404) ---
app.use((req, res, next) => {
  res.status(404).json({ message: 'Endpoint não encontrado.' });
});

// --- Handler de Erro Global ---
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