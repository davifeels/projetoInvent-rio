// backend/routes/inventarioLgpd.js

const express = require('express');
const router = express.Router();

// Importar o controlador específico para o inventário LGPD pessoal
const inventarioLgpdController = require('../controllers/inventarioLgpdController'); // <--- Verifique este caminho

// Importar middlewares de autenticação e perfil
const autenticarToken = require('../middlewares/authMiddleware');
const verificarPerfil = require('../middlewares/verificarPerfil');

// Definir os perfis permitidos para o inventário pessoal
// Geralmente, todos os usuários logados podem acessar seu próprio inventário.
const PERFIS_INVENTARIO_PESSOAL = [1, 2, 3]; // Ex: Master, Gestor, Normal

// Rota GET para o inventário pessoal do usuário logado
// GET /api/inventario-pessoal
router.get(
    '/', 
    autenticarToken, 
    verificarPerfil(PERFIS_INVENTARIO_PESSOAL), 
    inventarioLgpdController.getInventario // <--- Chama a função correta do controller
);

// Rota POST para criar ou atualizar o inventário pessoal do usuário logado
// POST /api/inventario-pessoal
router.post(
    '/', 
    autenticarToken, 
    verificarPerfil(PERFIS_INVENTARIO_PESSOAL), 
    inventarioLgpdController.cadastrarOuAtualizarInventarioUsuario // <--- Chama a função correta do controller
);

// Rota DELETE para o inventário pessoal do usuário logado
// DELETE /api/inventario-pessoal
router.delete(
    '/', 
    autenticarToken, 
    verificarPerfil(PERFIS_INVENTARIO_PESSOAL), 
    inventarioLgpdController.deleteInventario // <--- Chama a função correta do controller
);

module.exports = router;