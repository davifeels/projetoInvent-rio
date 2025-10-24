const db = require('../config/db');

const registrarAuditoria = (usuarioId, acao) => {
  const query = `
    INSERT INTO auditoria (usuario_id, acao)
    VALUES (?, ?)
  `;

  db.query(query, [usuarioId, acao], (err) => {
    if (err) {
      console.error('Erro ao registrar auditoria:', err);
    }
  });
};

module.exports = registrarAuditoria;
