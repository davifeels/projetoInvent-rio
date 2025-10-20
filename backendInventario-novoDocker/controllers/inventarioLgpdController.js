// controllers/inventarioLgpdController.js

const pool = require('../config/db');
const { registrarAuditoria } = require('./auditoriaController');
const ExcelJS = require('exceljs');

// --- FUNÇÕES AUXILIARES DE PARSE/STRINGIFY JSON ---
const parseJsonFields = (data) => {
    const fieldsToParse = [
        'dados_pessoais_comuns', 'dados_pessoais_sensiveis', 'categorias_titulares',
        'principios_lgpd', 'compartilhamento_detalhes', 'medidas_seguranca'
    ];
    const parsedData = { ...data };
    fieldsToParse.forEach(field => {
        if (parsedData[field] && typeof parsedData[field] === 'string') {
            try {
                parsedData[field] = JSON.parse(parsedData[field]);
            } catch (e) {
                console.error(`Erro ao fazer parse do campo JSON '${field}':`, e);
                parsedData[field] = [];
            }
        } else if (!parsedData[field]) { 
            parsedData[field] = [];
        }
    });
    return parsedData;
};

const stringifyJsonFields = (data) => {
    const fieldsToStringify = [
        'dados_pessoais_comuns', 'dados_pessoais_sensiveis', 'categorias_titulares',
        'principios_lgpd', 'compartilhamento_detalhes', 'medidas_seguranca'
    ];
    const stringifiedData = { ...data };
    fieldsToStringify.forEach(field => {
        if (Array.isArray(stringifiedData[field])) {
            stringifiedData[field] = JSON.stringify(stringifiedData[field]);
        }
        if (stringifiedData[field] === null || stringifiedData[field] === undefined) {
             stringifiedData[field] = null;
        }
    });
    return stringifiedData;
};

// --- FUNÇÕES DO CONTROLLER ---

/**
 * 1. Busca o inventário pessoal do usuário logado
 */
const getInventario = async (req, res) => {
    const { id: usuarioId, setor_id } = req.user; 
    try {
        const [rows] = await pool.query('SELECT * FROM inventario_lgpd WHERE usuario_id = ?', [usuarioId]);
        
        if (rows.length > 0) {
            const inventario = parseJsonFields(rows[0]);
            res.json(inventario);
        } else {
            res.status(204).send(); 
        }
    } catch (error) {
        console.error("Erro ao buscar inventário pessoal (MySQL):", error);
        await registrarAuditoria(usuarioId, 'ERRO_BUSCAR_INVENTARIO', setor_id, { 
            ip: req.ip, 
            erro: error.message 
        });
        res.status(500).json({ message: 'Erro interno ao buscar inventário.' });
    }
};

/**
 * 2. Salva ou atualiza o inventário pessoal do usuário logado usando uma transação
 */
const cadastrarOuAtualizarInventarioUsuario = async (req, res) => {
    const usuario = req.user; 
    const dados = req.body;
    
    let connection;

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [existingInventarioRows] = await connection.query(
            'SELECT id FROM inventario_lgpd WHERE usuario_id = ?', 
            [usuario.id]
        );
        
        let dadosParaSalvar = stringifyJsonFields(dados);

        // Remove campos que o banco de dados gerencia ou que não são colunas diretas
        delete dadosParaSalvar.id;
        delete dadosParaSalvar.usuario_id;
        delete dadosParaSalvar.createdAt;
        delete dadosParaSalvar.updatedAt;
        
        if (existingInventarioRows.length > 0) {
            // ATUALIZAÇÃO
            const inventarioId = existingInventarioRows[0].id;
            await connection.query(
                'UPDATE inventario_lgpd SET ? WHERE id = ?', 
                [dadosParaSalvar, inventarioId]
            );
            await registrarAuditoria(
                usuario.id, 
                'INVENTARIO_LGPD_ATUALIZADO', 
                usuario.setor_id, 
                { inventario_id: inventarioId, ip: req.ip }
            );
            res.status(200).json({ message: 'Seu inventário foi atualizado com sucesso.' });
        } else {
            // CRIAÇÃO
            dadosParaSalvar.usuario_id = usuario.id;
            const [result] = await connection.query(
                'INSERT INTO inventario_lgpd SET ?', 
                dadosParaSalvar
            );
            const novoId = result.insertId;
            await registrarAuditoria(
                usuario.id, 
                'INVENTARIO_LGPD_CRIADO', 
                usuario.setor_id, 
                { inventario_id: novoId, ip: req.ip }
            );
            res.status(201).json({ message: 'Seu inventário foi cadastrado com sucesso.' });
        }
        
        await connection.commit();

    } catch (err) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Erro ao cadastrar/atualizar inventário do usuário (MySQL):', err);
        await registrarAuditoria(
            usuario.id, 
            'INVENTARIO_LGPD_OPERACAO_FALHA', 
            usuario.setor_id, 
            { erro: err.message, ip: req.ip }
        );
        res.status(500).json({ message: 'Erro ao processar seu inventário.', detalhe: err.message });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

/**
 * 3. Deleta o inventário pessoal do usuário logado
 */
const deleteInventario = async (req, res) => {
    const { id: usuarioId, setor_id } = req.user; 

    try {
        const [result] = await pool.query('DELETE FROM inventario_lgpd WHERE usuario_id = ?', [usuarioId]); 

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Nenhum inventário encontrado para deletar.' });
        }

        await registrarAuditoria(usuarioId, 'INVENTARIO_LGPD_DELETADO', setor_id, { ip: req.ip });
        res.status(200).json({ message: 'Inventário deletado com sucesso.' });
    } catch (error) {
        console.error('Erro ao deletar inventário pessoal (MySQL):', error);
        await registrarAuditoria(usuarioId, 'ERRO_DELETAR_INVENTARIO', setor_id, { 
            ip: req.ip, 
            erro: error.message 
        });
        res.status(500).json({ message: 'Erro interno ao deletar inventário.' });
    }
};

/**
 * 4. Exporta todos os inventários LGPD para Excel (acesso Master)
 */
const exportAllInventariosLgpd = async (req, res) => {
    const { id: usuarioIdExecutor, setor_id: setorIdExecutor } = req.user;
    try {
        const query = `
            SELECT 
                i.*,
                u.nome as nome_usuario, 
                s.sigla as sigla_setor
            FROM inventario_lgpd i 
            JOIN usuarios u ON i.usuario_id = u.id
            LEFT JOIN setores s ON u.setor_id = s.id 
            ORDER BY u.nome ASC
        `;
        const [rows] = await pool.query(query);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Nenhum inventário LGPD encontrado para exportar.' });
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Inventários LGPD');

        worksheet.columns = [
            { header: 'ID Inventário', key: 'id', width: 15 },
            { header: 'Usuário Responsável', key: 'nome_usuario', width: 35 },
            { header: 'Setor', key: 'sigla_setor', width: 15 },
            { header: 'Nome Serviço/Processo', key: 'nome_servico', width: 40 },
            { header: 'Resumo da Atividade', key: 'resumo_atividade', width: 60 },
            { header: 'Data de Criação', key: 'createdAt', width: 20 },
            { header: 'Última Atualização', key: 'updatedAt', width: 20 },
        ];

        const dataForExcel = rows.map(row => {
            const parsedRow = parseJsonFields(row);
            const formattedRow = {};
            worksheet.columns.forEach(col => {
                const key = col.key;
                const value = parsedRow[key];
                if (Array.isArray(value)) {
                    formattedRow[key] = value.join('; ');
                } else if ((key === 'createdAt' || key === 'updatedAt') && value) {
                    formattedRow[key] = new Date(value).toLocaleString('pt-BR');
                } else {
                    formattedRow[key] = value;
                }
            });
            return formattedRow;
        });

        worksheet.addRows(dataForExcel);
        
        await registrarAuditoria(
            usuarioIdExecutor, 
            'RELATORIO_INVENTARIO_LGPD_EXPORTADO', 
            setorIdExecutor, 
            { ip: req.ip }
        );
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="Relatorio_Inventario_LGPD.xlsx"');
        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error("Erro ao exportar inventários LGPD:", error);
        await registrarAuditoria(
            usuarioIdExecutor, 
            'ERRO_EXPORTAR_INVENTARIO', 
            setorIdExecutor, 
            { ip: req.ip, erro: error.message }
        );
        res.status(500).json({ message: 'Erro interno ao exportar inventários.' });
    }
};

module.exports = {
    getInventario,
    cadastrarOuAtualizarInventarioUsuario,
    deleteInventario,
    exportAllInventariosLgpd
};