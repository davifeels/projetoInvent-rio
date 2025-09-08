// backend/server.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const dbPool = require('./config/db');

// --- Teste de conexão com o MySQL ---
dbPool.getConnection()
  .then(connection => {
    console.log('✅ Conexão com o MySQL estabelecida com sucesso!');
    connection.release();
  })
  .catch(err => {
    console.error('❌ ERRO CRÍTICO: Falha na conexão com o MySQL:', err);
    process.exit(1);
  });

// --- CORS ---
// AJUSTE PRINCIPAL AQUI: A origem agora é lida da variável de ambiente
// Isso permite que o Docker informe ao backend qual endereço do frontend é permitido.
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://10.0.11.88:3000', // Valor padrão para desenvolvimento local
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // suporte para preflight

// --- Middlewares globais ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// -------------------------------
//          ROTAS PÚBLICAS
// -------------------------------
const authRoutes = require('./routes/auth');
const funcoesRoutes = require('./routes/funcoes');
const setoresPublicRoutes = require('./routes/setoresPublic'); // 🔓 GET setores sem token

app.use('/api/auth', authRoutes);
app.use('/api/funcoes', funcoesRoutes);
app.use('/api/setores', setoresPublicRoutes); // apenas GET

// -------------------------------
//    MIDDLEWARE DE AUTENTICAÇÃO
// -------------------------------
const autenticarToken = require('./middlewares/authMiddleware');
app.use(autenticarToken);

// -------------------------------
//          ROTAS PRIVADAS
// -------------------------------
const setoresRoutes = require('./routes/setores'); // rotas protegidas: POST, PUT, DELETE
const usuarioRoutes = require('./routes/usuarios');
const cadastroRoutes = require('./routes/cadastros');
const inventarioRoutes = require('./routes/inventario');
const auditoriaRoutes = require('./routes/auditoria');
const inventarioLgpdRoutes = require('./routes/inventarioLgpd');
const adminRoutes = require('./routes/admin');

app.use('/api/setores', setoresRoutes); // protegido após token
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/cadastros', cadastroRoutes);
app.use('/api/inventario', inventarioRoutes);
app.use('/api/auditoria', auditoriaRoutes);
app.use('/api/inventario-pessoal', inventarioLgpdRoutes);
app.use('/api/admin', adminRoutes);

// -------------------------------
//     INICIALIZAÇÃO DO SERVIDOR
// -------------------------------
// A porta é lida da variável de ambiente, com 3000 como padrão.
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor backend rodando na porta ${PORT}`);
});

// Tratamento de erro caso a porta esteja ocupada
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Porta ${PORT} já está em uso. Finalize o processo ou use outra porta.`);
    process.exit(1);
  } else {
    throw err;
  }
});