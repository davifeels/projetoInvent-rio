// controllers/adminController.js

const inventarioController = require('./inventarioController');

/**
 * Ponto de entrada para a listagem de todos os inventários pelo admin.
 */
const getAllInventarios = async (req, res) => {
    // Chama a função correta para listar inventários
    return inventarioController.listarInventario(req, res);
};

/**
 * Ponto de entrada para a exportação de todos os inventários pelo admin.
 */
const exportarTodosParaExcel = async (req, res) => {
    // Chama a função correta para exportar inventário para Excel
    return inventarioController.exportarInventarioExcel(req, res);
};

module.exports = {
    getAllInventarios,
    exportarTodosParaExcel
};
