// backend/routes/admin.js

const express = require('express');
const router = express.Router();

// Controller que tem a lógica
const adminController = require('../controllers/adminController');

// Middleware para verificar o perfil (vamos usar o que já existe)
const verificarPerfil = require('../middlewares/verificarPerfil');
const perfilMaster = [1]; // ID do perfil Master

// Rota para LISTAR todos os inventários
// Caminho final será: GET /api/admin/inventarios
router.get(
    '/inventarios',
    verificarPerfil(perfilMaster),
    adminController.getAllInventarios
);

// Rota para EXPORTAR todos os inventários
// Caminho final será: GET /api/admin/inventarios/exportar/excel
router.get(
    '/inventarios/exportar/excel',
    verificarPerfil(perfilMaster),
    adminController.exportarTodosParaExcel
);


module.exports = router;