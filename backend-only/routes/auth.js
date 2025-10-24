const express = require('express');
const router = express.Router();
const Joi = require('joi');

// ✅ CORRETO: Importando as funções do controller de AUTENTICAÇÃO.
const { login, requestAccess } = require('../controllers/authController');

// --- Schemas de Validação ---

// Validação para a rota de login
const schemaLogin = Joi.object({
    email: Joi.string().email().required(),
    senha: Joi.string().min(6).required(),
});

// Validação para a rota de solicitação de acesso
const schemaRequestAccess = Joi.object({
    nome: Joi.string().min(3).required(),
    email: Joi.string().email().required(),
    senha: Joi.string().min(6).required(),
    setor_id: Joi.number().integer().required(),
    funcao_id: Joi.number().integer().required(),
});


// --- ROTAS PÚBLICAS (não precisam de token) ---

// Rota para o usuário fazer login
router.post('/login', (req, res, next) => {
    const { error } = schemaLogin.validate(req.body);
    if (error) return res.status(400).json({ message: `Erro de validação: ${error.details[0].message}` });
    next();
}, login);

// Rota para um novo usuário solicitar acesso ao sistema
router.post('/solicitar-acesso', (req, res, next) => {
    const { error } = schemaRequestAccess.validate(req.body);
    if (error) return res.status(400).json({ message: `Dados inválidos: ${error.details[0].message}` });
    next();
}, requestAccess);


module.exports = router;