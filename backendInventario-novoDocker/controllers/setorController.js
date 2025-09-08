// controllers/setorController.js

const db = require('../config/db');
const { registrarAuditoria } = require('./auditoriaController');
const ExcelJS = require('exceljs');

/**
 * Lista todos os setores.
 * Rota pública, mas audita se o usuário estiver logado.
 */
const listarSetores = async (req, res) => {
    // Se a rota for pública, req.user pode não existir. Usamos `|| {}` para evitar erros.
    const { id: usuarioIdExecutor, setor_id: setorIdExecutor } = req.user || {};

    try {
        if (usuarioIdExecutor) {
            await registrarAuditoria(usuarioIdExecutor, 'SETORES_LISTADOS', setorIdExecutor, { ip: req.ip });
        }
        const [results] = await db.query('SELECT id, nome, sigla FROM setores ORDER BY nome ASC');
        res.status(200).json(results);
    } catch (err) {
        console.error('Erro ao listar setores:', err);
        if (usuarioIdExecutor) {
            await registrarAuditoria(usuarioIdExecutor, 'SETORES_LISTAGEM_FALHA', setorIdExecutor, { erro: err.message, ip: req.ip });
        }
        res.status(500).json({ message: 'Erro interno ao listar setores.' });
    }
};

/**
 * Busca um único setor pelo seu ID.
 */
const buscarSetorPorId = async (req, res) => {
    // ✅ Padronizado para req.user
    if (!req.user) return res.status(401).json({ message: 'Acesso negado.' });
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
 * Cria um novo setor (Apenas Master).
 */
const criarSetor = async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'Acesso negado.' });
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
 * Atualiza um setor existente (Apenas Master).
 */
const atualizarSetor = async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'Acesso negado.' });
    const { id: usuarioIdExecutor, setor_id: setorIdExecutor } = req.user;
    const { id } = req.params;
    const { nome, sigla } = req.body;

    try {
        const [result] = await db.execute('UPDATE setores SET nome = ?, sigla = ? WHERE id = ?', [nome, sigla.toUpperCase(), id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Setor não encontrado para atualizar.' });
        }
        await registrarAuditoria(usuarioIdExecutor, 'SETOR_ATUALIZADO', setorIdExecutor, { setor_id_afetado: id, dados_novos: { nome, sigla }, ip: req.ip });
        res.status(200).json({ message: 'Setor atualizado com sucesso.' });
    } catch (err) {
        console.error('Erro ao atualizar setor:', err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Já existe um setor com este nome ou sigla.' });
        }
        await registrarAuditoria(usuarioIdExecutor, 'SETOR_ATUALIZACAO_FALHA', setorIdExecutor, { erro: err.message, ip: req.ip });
        res.status(500).json({ message: 'Erro interno ao atualizar setor.' });
    }
};

/**
 * Deleta um setor (Apenas Master).
 */
const deletarSetor = async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'Acesso negado.' });
    const { id: usuarioIdExecutor, setor_id: setorIdExecutor } = req.user;
    const { id } = req.params;

    try {
        // Medida de segurança: não permite excluir um setor se houver usuários vinculados a ele.
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
 * Lista todos os usuários de um setor específico.
 */
const listarUsuariosPorSetor = async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'Acesso negado.' });
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
const exportarSetoresExcel = async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'Acesso negado.' });
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


module.exports = {
    listarSetores,
    buscarSetorPorId,
    criarSetor,
    atualizarSetor,
    deletarSetor,
    listarUsuariosPorSetor,
    exportarSetoresExcel,
};
