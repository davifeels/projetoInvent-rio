// backend/routes/setoresPublic.js
const express = require('express');
const router = express.Router();

const { listarSetores } = require('../controllers/setorController');

// 🔓 Rota pública: lista os setores sem necessidade de autenticação
router.get('/', listarSetores);

module.exports = router;
