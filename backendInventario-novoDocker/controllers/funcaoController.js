// controllers/funcaoController.js

/**
 * --------------------------------------------------------------------
 * 1. DEPENDÊNCIAS
 * --------------------------------------------------------------------
 */
const db = require('../config/db');
const { registrarAuditoria } = require('./auditoriaController');
const ExcelJS = require('exceljs');

/**
 * --------------------------------------------------------------------
 * 2. FUNÇÕES DO CONTROLLER
 * --------------------------------------------------------------------
 */

/**
 * Lista todas as funções cadastradas.
 * Acessível publicamente, mas audita a ação se o usuário estiver logado.
 */
const listarFuncoes = async (req, res) => {
    // Se a rota for pública, req.user pode não existir. Usamos `|| {}` para evitar erros.
    const { id: usuarioIdExecutor, setor_id: setorIdExecutor } = req.user || {};

    try {
        if (usuarioIdExecutor) {
            await registrarAuditoria(usuarioIdExecutor, 'FUNCOES_LISTADAS', setorIdExecutor, { ip: req.ip });
        }
        const [funcoes] = await db.query('SELECT id, nome FROM funcoes ORDER BY nome ASC');
        res.status(200).json(funcoes);
    } catch (err) {
        console.error('Erro ao listar funções:', err);
        if (usuarioIdExecutor) {
            await registrarAuditoria(usuarioIdExecutor, 'FUNCOES_LISTAGEM_FALHA', setorIdExecutor, { erro: err.message, ip: req.ip });
        }
        res.status(500).json({ message: 'Erro interno ao buscar funções.' });
    }
};

/**
 * Cria uma nova função (Apenas Master).
 */
const criarFuncao = async (req, res) => {
    // ✅ PADRONIZAÇÃO: Usando req.user para consistência e segurança.
    if (!req.user) {
        return res.status(401).json({ message: 'Acesso negado. Requer autenticação.' });
    }
    const { id: usuarioIdExecutor, setor_id: setorIdExecutor } = req.user;
    const { nome } = req.body;

    try {
        if (!nome) {
            return res.status(400).json({ message: 'O nome da função é obrigatório.' });
        }
        const [result] = await db.execute('INSERT INTO funcoes (nome) VALUES (?)', [nome]);
        await registrarAuditoria(usuarioIdExecutor, 'FUNCAO_CRIADA', setorIdExecutor, { nova_funcao_id: result.insertId, nome_funcao: nome, ip: req.ip });
        res.status(201).json({ message: 'Função criada com sucesso!', id: result.insertId });
    } catch (err) {
        console.error('Erro ao criar função:', err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Já existe uma função com este nome.' });
        }
        await registrarAuditoria(usuarioIdExecutor, 'FUNCAO_CRIACAO_FALHA', setorIdExecutor, { erro: err.message, ip: req.ip });
        res.status(500).json({ message: 'Erro interno ao criar função.' });
    }
};

/**
 * Deleta uma função existente (Apenas Master).
 */
const deleteFuncao = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Acesso negado. Requer autenticação.' });
    }
    const { id: usuarioIdExecutor, setor_id: setorIdExecutor } = req.user;
    const { id } = req.params;

    try {
        // Medida de segurança: não permite excluir uma função se houver usuários vinculados a ela.
        const [usuarios] = await db.query('SELECT id FROM usuarios WHERE funcao_id = ?', [id]);
        if (usuarios.length > 0) {
            return res.status(400).json({ message: 'Não é possível excluir a função, pois existem usuários associados a ela.' });
        }

        const [result] = await db.execute('DELETE FROM funcoes WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Função não encontrada.' });
        }
        await registrarAuditoria(usuarioIdExecutor, 'FUNCAO_DELETADA', setorIdExecutor, { funcao_id_deletada: id, ip: req.ip });
        res.status(200).json({ message: 'Função excluída com sucesso.' });
    } catch (err) {
        console.error('Erro ao deletar função:', err);
        await registrarAuditoria(usuarioIdExecutor, 'FUNCAO_DELECAO_FALHA', setorIdExecutor, { erro: err.message, ip: req.ip });
        res.status(500).json({ message: 'Erro interno ao deletar função.' });
    }
};

/**
 * Exporta a lista de funções para um arquivo Excel.
 */
const exportarFuncoesExcel = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Acesso negado. Requer autenticação.' });
    }
    const { id: usuarioIdExecutor, setor_id: setorIdExecutor } = req.user;

    try {
        const [funcoes] = await db.query('SELECT id, nome FROM funcoes ORDER BY nome ASC');
        
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Funcoes');

        worksheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Nome da Função', key: 'nome', width: 50 },
        ];
        worksheet.addRows(funcoes);

        await registrarAuditoria(usuarioIdExecutor, 'RELATORIO_FUNCOES_EXPORTADO', setorIdExecutor, { ip: req.ip });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="Relatorio_Funcoes.xlsx"');
        
        await workbook.xlsx.write(res);
        res.end();

    } catch (err) {
        console.error('Erro ao exportar funções:', err);
        await registrarAuditoria(usuarioIdExecutor, 'RELATORIO_FUNCOES_FALHA', setorIdExecutor, { erro: err.message, ip: req.ip });
        if (!res.headersSent) {
            res.status(500).json({ message: 'Erro interno ao gerar relatório de funções.' });
        }
    }
};


module.exports = {
    listarFuncoes,
    criarFuncao,
    deleteFuncao,
    exportarFuncoesExcel,
};
