// backend/routes/admin.js

const express = require('express');
const router = express.Router();

// Controller que tem a lógica
const adminController = require('../controllers/adminController');

// ✅ CORREÇÃO: Importando o middleware de autenticação
const autenticarToken = require('../middlewares/authMiddleware');
const verificarPerfil = require('../middlewares/verificarPerfil');

// ✅ CORREÇÃO: Permite MASTER (1) e GESTOR/COORDENADOR (2)
const perfisMasterEGestor = [1, 2];

// Rota para LISTAR todos os inventários
// Caminho final será: GET /api/admin/inventarios
router.get(
    '/inventarios',
    autenticarToken,
    verificarPerfil(perfisMasterEGestor), // ✅ AGORA PERMITE PERFIL 1 E 2
    adminController.getAllInventarios
);

// Rota para EXPORTAR todos os inventários
// Caminho final será: GET /api/admin/inventarios/exportar/excel
router.get(
    '/inventarios/exportar/excel',
    autenticarToken,
    verificarPerfil(perfisMasterEGestor), // ✅ AGORA PERMITE PERFIL 1 E 2
    adminController.exportarTodosParaExcel
);

module.exports = router;