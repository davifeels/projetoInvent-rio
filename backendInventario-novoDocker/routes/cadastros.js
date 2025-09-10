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

// Schema de validação para a solicitação de um novo cadastro
// ⚠️ Removemos qualquer menção a perfil_id, apenas tipo_usuario
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

// Criar novo cadastro (usuário ou coordenador)
router.post(
  '/',
  autenticarToken,
  verificarPerfil([1, 2]), // Apenas Master e Coordenador podem criar
  validarCorpoDaRequisicao,
  (req, res) => {
    // Se for coordenador, cria direto
    if (req.body.tipo_usuario === 'COORDENADOR') {
      return cadastrarCoordenadorDireto(req, res);
    }
    // Se for usuário comum, envia para aprovação
    return cadastrarCadastro(req, res);
  }
);

// Aprovar cadastro pendente
router.patch(
  '/aprovar/:id',
  autenticarToken,
  verificarPerfil([1, 2]),
  aprovarCadastro
);

// Rejeitar cadastro pendente
router.patch(
  '/rejeitar/:id',
  autenticarToken,
  verificarPerfil([1, 2]),
  rejeitarCadastro
);

// Listar cadastros pendentes
router.get(
  '/pendentes',
  autenticarToken,
  verificarPerfil([1, 2]),
  listarPendentes
);

module.exports = router;
