const express = require('express');
const router = express.Router();
const Joi = require('joi');

// Importando os controllers
const {
  cadastrarCadastro,
  aprovarCadastro,
  rejeitarCadastro,
  listarPendentes,
  cadastrarCoordenadorDireto
} = require('../controllers/cadastroController');

// Importando os middlewares
const autenticarToken = require('../middlewares/authMiddleware');
const verificarPerfil = require('../middlewares/verificarPerfil');

// Schema de validação para a solicitação de um novo cadastro.
const schemaCadastro = Joi.object({
  nome: Joi.string().min(3).required(),
  email: Joi.string().email().required(),
  senha: Joi.string().min(6).required(),
  tipo_usuario: Joi.string().valid('COORDENADOR', 'USUARIO').required(),
  sigla_setor: Joi.string().required(),
  funcao_id: Joi.number().integer().required()
});

// Middleware de validação
const validarCorpoDaRequisicao = (req, res, next) => {
  const { error } = schemaCadastro.validate(req.body);
  if (error) {
    return res.status(400).json({ message: `Erro de validação: ${error.details[0].message}` });
  }
  next();
};

// --- ROTAS DEFINIDAS ---

// ✅ CORRIGIDO: Rota para iniciar o processo de cadastro (usuário ou coordenador)
router.post(
  '/',
  autenticarToken,
  verificarPerfil([1, 2]),
  validarCorpoDaRequisicao,
  (req, res) => {
    // A lógica de redirecionamento agora é feita de forma mais clara
    if (req.body.tipo_usuario === 'COORDENADOR') {
      cadastrarCoordenadorDireto(req, res);
    } else {
      cadastrarCadastro(req, res);
    }
  }
);

// Rota para APROVAR uma solicitação de cadastro (apenas para usuários comuns)
router.patch(
  '/aprovar/:id',
  autenticarToken,
  verificarPerfil([1, 2]),
  aprovarCadastro
);

// Rota para REJEITAR uma solicitação de cadastro
router.patch(
  '/rejeitar/:id',
  autenticarToken,
  verificarPerfil([1, 2]),
  rejeitarCadastro
);

// Rota para LISTAR os cadastros pendentes (apenas para usuários comuns)
router.get('/pendentes', autenticarToken, verificarPerfil([1, 2]), listarPendentes);

module.exports = router;