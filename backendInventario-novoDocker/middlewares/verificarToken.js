const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');  // Pega o token do header

  if (!token) {
    return res.status(403).json({ message: 'Token não fornecido.' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Token inválido ou expirado.' });
    }

    req.usuario = decoded;  // Adiciona as informações do usuário no `req`
    next();  // Passa para o próximo middleware ou rota
  });
};

module.exports = verificarToken;
