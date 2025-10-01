// backend/routes/setores.js

const express = require('express');
const router = express.Router();
const setorController = require('../controllers/setorController');
const autenticarToken = require('../middlewares/authMiddleware');
const verificarPerfil = require('../middlewares/verificarPerfil');

// ROTA PÚBLICA (NÃO precisa de token)
router.get('/', setorController.getAllSetores);

// ✅ CORREÇÃO: Rotas específicas ANTES das rotas com parâmetros dinâmicos
// ROTAS PRIVADAS (PRECISAM de token)
router.get('/exportar/excel', autenticarToken, setorController.exportSetoresExcel);
router.get('/:id/usuarios', autenticarToken, setorController.getUsuariosBySetor);

// ROTAS RESTRITAS (PRECISAM de token e perfil Master)
router.post('/', autenticarToken, verificarPerfil([1]), setorController.createSetor);
router.delete('/:id', autenticarToken, verificarPerfil([1]), setorController.deleteSetor);

module.exports = router;