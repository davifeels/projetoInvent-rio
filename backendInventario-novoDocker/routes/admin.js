// backend/routes/admin.js

const express = require('express');
const router = express.Router();

// Controller que tem a lógica
const adminController = require('../controllers/adminController');

// ✅ CORREÇÃO: Importando o middleware de autenticação
const autenticarToken = require('../middlewares/authMiddleware');
const verificarPerfil = require('../middlewares/verificarPerfil');

const perfilMaster = [1]; // ID do perfil Master

// ✅ CORREÇÃO: Adicionado autenticarToken ANTES de verificarPerfil
// Rota para LISTAR todos os inventários
// Caminho final será: GET /api/admin/inventarios
router.get(
    '/inventarios',
    autenticarToken,              // ✅ ADICIONADO
    verificarPerfil(perfilMaster),
    adminController.getAllInventarios
);

// ✅ CORREÇÃO: Adicionado autenticarToken ANTES de verificarPerfil
// Rota para EXPORTAR todos os inventários
// Caminho final será: GET /api/admin/inventarios/exportar/excel
router.get(
    '/inventarios/exportar/excel',
    autenticarToken,              // ✅ ADICIONADO
    verificarPerfil(perfilMaster),
    adminController.exportarTodosParaExcel
);

module.exports = router;