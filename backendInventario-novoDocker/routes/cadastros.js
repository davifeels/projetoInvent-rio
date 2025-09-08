const express = require('express');
const router = express.Router();
const Joi = require('joi');

// Importando os controllers
const {
  cadastrarCadastro,
  aprovarCadastro,
  rejeitarCadastro, // Certifique-se que esta função está sendo exportada do seu controller
  listarPendentes,
  // ...outras funções
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
  funcao_id: Joi.number().integer().required() // <<< ADICIONE ESTA LINHA
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

// Rota para CRIAR uma nova SOLICITAÇÃO de cadastro
router.post(
  '/',
  autenticarToken,
  verificarPerfil([1, 2]),
  validarCorpoDaRequisicao,
  cadastrarCadastro
);

// Rota para APROVAR uma solicitação de cadastro
// Usando PATCH pois é uma atualização parcial (mudar o status)
router.patch(
  '/aprovar/:id',
  autenticarToken,
  verificarPerfil([1, 2]),
  aprovarCadastro
);

// Rota para REJEITAR uma solicitação de cadastro (CORREÇÃO)
// A rota que estava faltando ou definida incorretamente.
router.patch(
  '/rejeitar/:id', // Garante que a rota exista e use o método PATCH
  autenticarToken,
  verificarPerfil([1, 2]),
  rejeitarCadastro
);


// Rota para LISTAR os cadastros pendentes
router.get('/pendentes', autenticarToken, verificarPerfil([1, 2]), listarPendentes);


module.exports = router;
