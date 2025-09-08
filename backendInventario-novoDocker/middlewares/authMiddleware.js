const jwt = require('jsonwebtoken');

const rotasPublicas = [
  '/api/auth/login',
  '/api/auth/solicitar-acesso',
  '/api/setores',
  '/api/funcoes',
  '/favicon.ico'
];

const autenticarToken = (req, res, next) => {
  // Se a rota for pública, libera sem token
  if (rotasPublicas.some(r => req.path === r || req.path.startsWith(r + '/'))) {
    return next();
  }

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.error(`[AUTH] ❌ Acesso negado para ${req.method} ${req.originalUrl}: Token não fornecido.`);
    return res.status(401).json({ message: 'Acesso não autorizado. Token não fornecido.' });
  }

  try {
    console.log('\n--- DEBUG DE AUTENTICAÇÃO ---');
    console.log('[MIDDLEWARE] Chave Secreta Usada para VERIFICAR o Token:', process.env.JWT_SECRET);
    console.log('-----------------------------\n');

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    console.log(`[AUTH] ✅ Acesso autorizado para Usuário ID: ${req.user.id}, Rota: ${req.method} ${req.originalUrl}`);

    next();
  } catch (err) {
    console.error(`[AUTH] ❌ Acesso negado para ${req.method} ${req.originalUrl}: Token inválido. Erro: ${err.message}`);
    return res.status(403).json({ message: 'Acesso negado. O token é inválido ou expirou.' });
  }
};

module.exports = autenticarToken;
