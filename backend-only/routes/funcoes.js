// routes/funcoesRoutes.js

const express = require('express');
const router = express.Router();
const Joi = require('joi');

// --- Middlewares ---
const autenticarToken = require('../middlewares/authMiddleware'); // Mantenha para outras rotas protegidas
const verificarPerfil = require('../middlewares/verificarPerfil');

// --- Controller ---
const {
    listarFuncoes,
    criarFuncao,
    deleteFuncao,
    exportarFuncoesExcel
} = require('../controllers/funcaoController');

// --- Schema de Validação ---
const schemaFuncao = Joi.object({
    nome: Joi.string().min(3).max(100).required()
});

// Middleware de validação para ser usado nas rotas de criação
const validarFuncao = (req, res, next) => {
    const { error } = schemaFuncao.validate(req.body);
    if (error) {
        return res.status(400).json({ message: `Erro de validação: ${error.details[0].message}` });
    }
    next();
};


// --- ROTAS ---

// Rota para listar todas as funções.
// ✅ CORREÇÃO AQUI: Removido 'autenticarToken' para que esta rota seja pública.
router.get('/', listarFuncoes);


// --- ROTAS PROTEGIDAS ESPECÍFICAS ---

// Rota para exportar para Excel - Requer perfil Master (1) ou Coordenador (2)
router.get('/exportar/excel', autenticarToken, verificarPerfil([1, 2]), exportarFuncoesExcel);

// Rotas que exigem APENAS perfil de ADM Master (1)
router.post('/', autenticarToken, verificarPerfil([1]), validarFuncao, criarFuncao);
router.delete('/:id', autenticarToken, verificarPerfil([1]), deleteFuncao);


module.exports = router;