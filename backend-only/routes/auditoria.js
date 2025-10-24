// routes/auditoria.js

/**
 * --------------------------------------------------------------------
 * 1. DEPENDÊNCIAS E CONFIGURAÇÃO
 * --------------------------------------------------------------------
 */
const express = require('express');
const router = express.Router();

// Middlewares
const autenticarToken = require('../middlewares/authMiddleware');
const verificarPerfil = require('../middlewares/verificarPerfil');

// Controller
const { 
    listarAuditoria,
    exportarAuditoriaExcel // Importa a função de exportação
} = require('../controllers/auditoriaController');


/**
 * --------------------------------------------------------------------
 * 2. DEFINIÇÃO DAS ROTAS
 * --------------------------------------------------------------------
 */

// Rota para LISTAR os registros de auditoria (requer perfil Master ou Coordenador)
router.get(
    '/', 
    autenticarToken, 
    verificarPerfil([1, 2]), 
    listarAuditoria
);

// ✅ ROTA QUE FALTAVA ADICIONADA AQUI
// Rota para EXPORTAR os registros de auditoria para um arquivo Excel.
router.get(
    '/exportar/excel', 
    autenticarToken, 
    verificarPerfil([1, 2]), 
    exportarAuditoriaExcel
);


module.exports = router;
