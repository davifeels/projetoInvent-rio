// backend/controllers/setorController.js

const db = require('../config/db');
const { registrarAuditoria } = require('./auditoriaController');
const ExcelJS = require('exceljs');

/**
 * Busca todos os setores.
 */
const getAllSetores = async (req, res) => {
    const usuarioLogado = req.user || {};
    try {
        const [results] = await db.query('SELECT id, nome, sigla FROM setores ORDER BY nome ASC');
        if (usuarioLogado.id) {
            await registrarAuditoria(usuarioLogado.id, 'SETORES_LISTADOS', usuarioLogado.setor_id, { ip: req.ip });
        }
        res.status(200).json(results);
    } catch (err) {
        console.error('Erro ao listar setores:', err);
        if (usuarioLogado.id) {
            await registrarAuditoria(usuarioLogado.id, 'SETORES_LISTAGEM_FALHA', usuarioLogado.setor_id, { erro: err.message, ip: req.ip });
        }
        res.status(500).json({ message: 'Erro interno ao listar setores.' });
    }
};

/**
 * Busca um único setor pelo seu ID.
 */
const getSetorById = async (req, res) => {
    const { id: usuarioIdExecutor, setor_id: setorIdExecutor } = req.user;
    const { id } = req.params;
    try {
        const [[setor]] = await db.query('SELECT * FROM setores WHERE id = ?', [id]);
        if (!setor) {
            return res.status(404).json({ message: 'Setor não encontrado.' });
        }
        res.status(200).json(setor);
    } catch (err) {
        console.error('Erro ao buscar setor:', err);
        await registrarAuditoria(usuarioIdExecutor, 'SETOR_BUSCA_FALHA', setorIdExecutor, { erro: err.message, ip: req.ip });
        res.status(500).json({ message: 'Erro interno ao buscar setor.' });
    }
};

/**
 * Cria um novo setor.
 */
const createSetor = async (req, res) => {
    const { id: usuarioIdExecutor, setor_id: setorIdExecutor } = req.user;
    const { nome, sigla } = req.body;
    try {
        const [result] = await db.execute('INSERT INTO setores (nome, sigla) VALUES (?, ?)', [nome, sigla.toUpperCase()]);
        await registrarAuditoria(usuarioIdExecutor, 'SETOR_CRIADO', setorIdExecutor, { novo_setor_id: result.insertId, nome, sigla, ip: req.ip });
        res.status(201).json({ message: 'Setor criado com sucesso!', id: result.insertId });
    } catch (err) {
        console.error('Erro ao criar setor:', err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Já existe um setor com este nome ou sigla.' });
        }
        await registrarAuditoria(usuarioIdExecutor, 'SETOR_CRIACAO_FALHA', setorIdExecutor, { erro: err.message, ip: req.ip });
        res.status(500).json({ message: 'Erro interno ao criar setor.' });
    }
};

/**
 * Deleta um setor.
 */
const deleteSetor = async (req, res) => {
    const { id: usuarioIdExecutor, setor_id: setorIdExecutor } = req.user;
    const { id } = req.params;
    try {
        const [usuarios] = await db.query('SELECT id FROM usuarios WHERE setor_id = ?', [id]);
        if (usuarios.length > 0) {
            return res.status(400).json({ message: 'Não é possível excluir o setor, pois existem usuários associados a ele. Reatribua os usuários primeiro.' });
        }
        const [result] = await db.execute('DELETE FROM setores WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Setor não encontrado.' });
        }
        await registrarAuditoria(usuarioIdExecutor, 'SETOR_DELETADO', setorIdExecutor, { setor_id_deletado: id, ip: req.ip });
        res.status(200).json({ message: 'Setor excluído com sucesso.' });
    } catch (err) {
        console.error('Erro ao deletar setor:', err);
        await registrarAuditoria(usuarioIdExecutor, 'SETOR_DELECAO_FALHA', setorIdExecutor, { erro: err.message, ip: req.ip });
        res.status(500).json({ message: 'Erro interno ao deletar setor.' });
    }
};

/**
 * Busca todos os usuários de um setor específico.
 */
const getUsuariosBySetor = async (req, res) => {
    const { id: usuarioIdExecutor, setor_id: setorIdExecutor } = req.user;
    const { id } = req.params;
    try {
        const [usuarios] = await db.query('SELECT id, nome, email, status FROM usuarios WHERE setor_id = ? ORDER BY nome ASC', [id]);
        res.status(200).json(usuarios);
    } catch (err) {
        console.error('Erro ao listar usuários por setor:', err);
        await registrarAuditoria(usuarioIdExecutor, 'USUARIOS_POR_SETOR_LISTAGEM_FALHA', setorIdExecutor, { erro: err.message, ip: req.ip });
        res.status(500).json({ message: 'Erro interno ao listar usuários do setor.' });
    }
};

/**
 * Exporta a lista de setores para um arquivo Excel.
 */
const exportSetoresExcel = async (req, res) => {
    const { id: usuarioIdExecutor, setor_id: setorIdExecutor } = req.user;
    try {
        const [setores] = await db.query('SELECT id, nome, sigla FROM setores ORDER BY nome ASC');
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Setores');
        worksheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Nome do Setor', key: 'nome', width: 50 },
            { header: 'Sigla', key: 'sigla', width: 15 }
        ];
        worksheet.addRows(setores);
        await registrarAuditoria(usuarioIdExecutor, 'RELATORIO_SETORES_EXPORTADO', setorIdExecutor, { ip: req.ip });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="Relatorio_Setores.xlsx"');
        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        console.error('Erro ao exportar setores para Excel:', err);
        await registrarAuditoria(usuarioIdExecutor, 'RELATORIO_SETORES_FALHA', setorIdExecutor, { erro: err.message, ip: req.ip });
        res.status(500).json({ message: 'Erro interno ao gerar relatório.' });
    }
};

// Exporta todas as funções com os nomes corretos.
module.exports = {
    getAllSetores,
    getSetorById,
    createSetor,
    // A função de update não estava no seu código, se precisar, pode adicionar aqui.
    // updateSetor, 
    deleteSetor,
    getUsuariosBySetor,
    exportSetoresExcel
};