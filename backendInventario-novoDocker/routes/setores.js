// backend/routes/setores.js

const express = require('express');
const router = express.Router();
const setorController = require('../controllers/setorController');
const autenticarToken = require('../middlewares/authMiddleware');
const verificarPerfil = require('../middlewares/verificarPerfil');

// ROTA PÚBLICA (NÃO precisa de token)
router.get('/', setorController.getAllSetores);

// ROTAS PRIVADAS (PRECISAM de token)
router.get('/:id/usuarios', autenticarToken, setorController.getUsuariosBySetor);
router.get('/exportar/excel', autenticarToken, setorController.exportSetoresExcel);

// ROTAS RESTRITAS (PRECISAM de token e perfil Master)
router.post('/', autenticarToken, verificarPerfil([1]), setorController.createSetor);
router.delete('/:id', autenticarToken, verificarPerfil([1]), setorController.deleteSetor);

module.exports = router;