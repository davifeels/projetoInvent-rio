const jwt = require('jsonwebtoken');

const rotasPublicas = [
  '/api/auth/login',
  '/api/auth/solicitar-acesso',
  '/api/setores',
  '/api/funcoes',
  '/favicon.ico',
  '/health'
];

const autenticarToken = (req, res, next) => {
  // Libera rotas públicas
  if (rotasPublicas.some(r => req.path === r || req.path.startsWith(r + '/'))) {
    return next();
  }

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'Acesso não autorizado. Token não fornecido.' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ 
      success: false,
      message: 'Token inválido ou expirado.' 
    });
  }
};

module.exports = autenticarToken;