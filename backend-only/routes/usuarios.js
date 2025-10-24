const express = require('express');
const router = express.Router();
const Joi = require('joi');
const autenticarToken = require('../middlewares/authMiddleware');
const verificarPerfil = require('../middlewares/verificarPerfil');
const usuarioController = require('../controllers/usuarioController');

// --- Schemas de Validação (Joi) ---

// Schema para a criação de um novo usuário.
const schemaCriarUsuario = Joi.object({
    nome: Joi.string().min(3).required(),
    email: Joi.string().email().required(),
    senha: Joi.string().min(6).required(),
    perfil_id: Joi.number().integer().valid(1, 2, 3).required(),
    tipo_usuario: Joi.string().required(),
    sigla_setor: Joi.string().required(),
    funcao_id: Joi.number().integer().required(),
    status: Joi.string().valid('ativo', 'pendente', 'inativo', 'rejeitado', 'ativo_inventario_pendente').optional()
});

// Schema para a atualização de um usuário (campos opcionais).
const schemaAtualizarUsuario = Joi.object({
    nome: Joi.string().min(3),
    email: Joi.string().email(),
    // CORREÇÃO: Permite que a senha seja enviada opcionalmente e valida o tamanho mínimo.
    senha: Joi.string().min(6).optional().allow(''), 
    perfil_id: Joi.number().integer().valid(1, 2, 3),
    setor_id: Joi.number().integer(),
    funcao_id: Joi.number().integer(),
    status: Joi.string().valid('ativo', 'pendente', 'inativo', 'rejeitado', 'ativo_inventario_pendente')
}).min(1); // Exige que pelo menos um campo seja enviado para atualização.

// --- Middleware de Validação ---
const validar = (schema) => (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }
    next();
};

// --- Definição das Rotas ---

// Lista todos os usuários (GET /api/usuarios)
router.get('/', autenticarToken, verificarPerfil([1, 2]), usuarioController.listarUsuarios);

// Lista usuários com status "pendente" (GET /api/usuarios/pendentes)
router.get('/pendentes', autenticarToken, verificarPerfil([1, 2]), usuarioController.listarUsuariosPendentes);

// Exporta a lista de usuários para Excel (GET /api/usuarios/exportar/excel)
router.get('/exportar/excel', autenticarToken, verificarPerfil([1, 2]), usuarioController.exportarUsuariosExcel);

// Busca um usuário específico pelo ID (GET /api/usuarios/:id)
router.get('/:id', autenticarToken, verificarPerfil([1, 2]), usuarioController.buscarUsuarioPorId);

// Cria um novo usuário (POST /api/usuarios)
router.post('/', autenticarToken, verificarPerfil([1, 2]), validar(schemaCriarUsuario), usuarioController.criarUsuario);

// Atualiza um usuário (PUT /api/usuarios/:id)
// Esta rota agora lida com a atualização de dados e a redefinição opcional de senha.
router.put('/:id', autenticarToken, verificarPerfil([1, 2]), validar(schemaAtualizarUsuario), usuarioController.atualizarUsuario);

// Exclui um usuário (DELETE /api/usuarios/:id) - Apenas Master
router.delete('/:id', autenticarToken, verificarPerfil([1]), usuarioController.excluirUsuario);

// Aprova um usuário (PATCH /api/usuarios/:id/aprovar)
router.patch('/:id/aprovar', autenticarToken, verificarPerfil([1, 2]), usuarioController.aprovarUsuario);

// Rejeita um usuário (PATCH /api/usuarios/:id/rejeitar)
router.patch('/:id/rejeitar', autenticarToken, verificarPerfil([1, 2]), usuarioController.rejeitarUsuario);

// REMOVIDO: A rota PATCH dedicada para redefinir senha não é mais necessária.

module.exports = router;