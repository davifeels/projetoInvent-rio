// routes/inventario.js

const express = require('express');
const router = express.Router();
const autenticarToken = require('../middlewares/authMiddleware');
const verificarPerfil = require('../middlewares/verificarPerfil');
const inventarioController = require('../controllers/inventarioController');


router.get(
    '/',
    autenticarToken,
    verificarPerfil([1, 2]),
    inventarioController.listarInventario
);

// Exporta o inventário para Excel (acessível por Master e Coordenador)
router.get(
    '/exportar/excel',
    autenticarToken,
    verificarPerfil([1, 2]),
    inventarioController.exportarInventarioExcel
);

router.post(
    '/',
    autenticarToken,
    // Permite acesso para Master, Coordenador e Usuário Comum
    verificarPerfil([1, 2, 3]), 
    inventarioController.cadastrarOuAtualizarInventarioUsuario
);

module.exports = router;
