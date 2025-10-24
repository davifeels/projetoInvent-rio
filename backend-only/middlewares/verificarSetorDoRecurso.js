// middlewares/verificarSetorDoRecurso.js
const db = require('../config/db');
const { registrarAuditoria } = require('../controllers/auditoriaController');

const verificarSetorDoRecurso = (tabela, campoUsuario = 'usuario_id') => {
  return async (req, res, next) => {
    // ✅ CORREÇÃO: Mudado de req.usuario para req.user
    if (!req.user) {
      try {
        await registrarAuditoria(null, 'TENTATIVA_ACESSO_SEM_AUTENTICACAO_VERIFICAR_SETOR', null, { 
          rota: req.originalUrl, 
          ip: req.ip 
        });
      } catch (auditError) {
        console.error('Falha ao auditar TENTATIVA_ACESSO_SEM_AUTENTICACAO_VERIFICAR_SETOR:', auditError);
      }
      return res.status(401).json({ message: 'Usuário não autenticado.' });
    }

    // ✅ CORREÇÃO: Mudado de req.usuario para req.user
    const { id: usuarioId, perfil_id, setor_id: setorIdUsuario } = req.user;
    const recursoId = req.params.id;

    if (perfil_id === 1) return next(); // Master pode tudo

    try {
      const query = `
        SELECT u.setor_id
        FROM ${tabela} r
        JOIN usuarios u ON r.${campoUsuario} = u.id
        WHERE r.id = ?
      `;
      const [results] = await db.query(query, [recursoId]);

      if (results.length === 0) {
        return res.status(404).json({ message: 'Recurso não encontrado.' });
      }

      const setorDoRecurso = results[0].setor_id;

      if (setorDoRecurso !== setorIdUsuario) {
        try {
          await registrarAuditoria(
            usuarioId,
            'TENTATIVA_ACESSO_RECURSO_OUTRO_SETOR',
            setorIdUsuario,
            { 
              rota: req.originalUrl, 
              recurso_id: recursoId, 
              tabela: tabela, 
              setor_recurso: setorDoRecurso, 
              ip: req.ip 
            }
          );
        } catch (auditError) {
          console.error('Falha ao auditar TENTATIVA_ACESSO_RECURSO_OUTRO_SETOR:', auditError);
        }
        return res.status(403).json({ message: 'Acesso negado: recurso de outro setor.' });
      }
      next();
    } catch (err) {
      console.error('Erro ao verificar setor do recurso:', err);
      try {
        await registrarAuditoria(
          usuarioId, 
          'ERRO_MIDDLEWARE_VERIFICAR_SETOR_RECURSO', 
          setorIdUsuario, 
          { 
            erro: err.message, 
            rota: req.originalUrl, 
            recurso_id: recursoId, 
            tabela: tabela, 
            ip: req.ip 
          }
        );
      } catch (auditError) {
        console.error('Falha ao auditar ERRO_MIDDLEWARE_VERIFICAR_SETOR_RECURSO:', auditError);
      }
      return res.status(500).json({ message: 'Erro ao verificar setor.' });
    }
  };
};

module.exports = verificarSetorDoRecurso;