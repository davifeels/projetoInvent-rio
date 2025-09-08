// routes/setores.js
const express = require('express');
const router = express.Router();
const Joi = require('joi');

const autenticarToken = require('../middlewares/authMiddleware');
const verificarPerfil = require('../middlewares/verificarPerfil');

const { 
  criarSetor,
  atualizarSetor,
  deletarSetor,
  buscarSetorPorId,
  listarUsuariosPorSetor,
  exportarSetoresExcel
} = require('../controllers/setorController');

// --- Validação com Joi ---
const schemaSetor = Joi.object({
  nome: Joi.string().min(3).max(100).required(),
  sigla: Joi.string().min(2).max(10).uppercase().required()
});

const validarSetor = (req, res, next) => {
  const { error } = schemaSetor.validate(req.body);
  if (error) {
    return res.status(400).json({ message: `Erro de validação: ${error.details[0].message}` });
  }
  next();
};

// ✅ APLICA O MIDDLEWARE DE AUTENTICAÇÃO PARA TODAS AS ROTAS ABAIXO
router.use(autenticarToken);

// --- ROTAS COM PERMISSÃO ---

// ADM Master (1) ou Coordenador (2)
router.get('/:id', verificarPerfil([1, 2]), buscarSetorPorId);
router.get('/:id/usuarios', verificarPerfil([1, 2]), listarUsuariosPorSetor);
router.get('/exportar/excel', verificarPerfil([1, 2]), exportarSetoresExcel);

// Apenas ADM Master (1)
router.post('/', verificarPerfil([1]), validarSetor, criarSetor);
router.put('/:id', verificarPerfil([1]), validarSetor, atualizarSetor);
router.delete('/:id', verificarPerfil([1]), deletarSetor);

module.exports = router;
