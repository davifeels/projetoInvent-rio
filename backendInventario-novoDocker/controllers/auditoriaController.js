// controllers/auditoriaController.js

/**
 * --------------------------------------------------------------------
 * 1. DEPENDÊNCIAS
 * --------------------------------------------------------------------
 */
const db = require('../config/db');
const ExcelJS = require('exceljs');

/**
 * --------------------------------------------------------------------
 * 2. FUNÇÕES AUXILIARES
 * --------------------------------------------------------------------
 */

/**
 * Constrói a query SQL para listar ou exportar a auditoria, aplicando filtros e permissões.
 * @param {object} filtros - Objeto com os filtros da query string (ex: { data_inicio, data_fim }).
 * @param {object} perfilExecutor - O objeto 'user' do usuário que está fazendo a requisição.
 * @returns {{sql: string, params: Array}} Objeto contendo a query SQL e os parâmetros.
 */
function construirQueryAuditoria(filtros, perfilExecutor) {
    let sql = `
        SELECT 
            a.id, a.acao, a.detalhes, a.data_acao,
            u.nome AS usuario_nome,
            s.sigla AS setor_sigla
        FROM auditoria a
        LEFT JOIN usuarios u ON a.usuario_id = u.id
        LEFT JOIN setores s ON a.setor_id = s.id
    `;

    const whereClauses = [];
    const params = [];

    // ✅ CORREÇÃO DE SEGURANÇA APLICADA AQUI
    // Se o perfil for 2 (Coordenador), adiciona um filtro obrigatório
    // para que ele veja apenas os logs do seu próprio setor.
    if (perfilExecutor && perfilExecutor.perfil_id === 2) {
        whereClauses.push("a.setor_id = ?");
        params.push(perfilExecutor.setor_id);
    }

    // Filtros da query string (sem alteração)
    if (filtros.data_inicio) {
        whereClauses.push("a.data_acao >= ?");
        params.push(filtros.data_inicio);
    }
    if (filtros.data_fim) {
        const dataFimAjustada = new Date(filtros.data_fim);
        dataFimAjustada.setDate(dataFimAjustada.getDate() + 1);
        whereClauses.push("a.data_acao < ?");
        params.push(dataFimAjustada);
    }
    if (filtros.acao) {
        whereClauses.push("a.acao LIKE ?");
        params.push(`%${filtros.acao}%`);
    }
    if (filtros.usuario_id) {
        whereClauses.push("a.usuario_id = ?");
        params.push(filtros.usuario_id);
    }

    if (whereClauses.length > 0) {
        sql += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    sql += ' ORDER BY a.data_acao DESC';

    return { sql, params };
}


/**
 * --------------------------------------------------------------------
 * 3. FUNÇÕES DO CONTROLLER
 * --------------------------------------------------------------------
 */

/**
 * Registra uma nova ação de auditoria no banco de dados.
 */
const registrarAuditoria = async (usuarioIdExecutor, acao, setorIdDoExecutor, detalhesObjeto = null) => {
    try {
        const detalhesString = detalhesObjeto ? JSON.stringify(detalhesObjeto) : null;
        const query = `
            INSERT INTO auditoria (usuario_id, acao, setor_id, detalhes, data_acao)
            VALUES (?, ?, ?, ?, NOW(3))
        `;
        const setorIdFinal = setorIdDoExecutor === undefined ? null : setorIdDoExecutor;
        const usuarioIdFinal = usuarioIdExecutor === undefined ? null : usuarioIdExecutor;
        
        await db.execute(query, [usuarioIdFinal, acao, setorIdFinal, detalhesString]);
    } catch (err) {
        console.error('ERRO CRÍTICO AO REGISTRAR AUDITORIA:', err);
    }
};

/**
 * Lista os registros de auditoria com base nos filtros e permissões.
 */
const listarAuditoria = async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'Acesso negado.' });

    try {
        const filtros = req.query;
        // Passa o perfil do usuário para a função que constrói a query
        const { sql, params } = construirQueryAuditoria(filtros, req.user);
        const [auditorias] = await db.query(sql, params);

        const auditoriasFormatadas = auditorias.map(log => ({
            ...log,
            data_acao_formatada: new Date(log.data_acao).toLocaleString('pt-BR'),
        }));
        
        res.status(200).json(auditoriasFormatadas);

    } catch (err) {
        console.error('Erro ao listar auditoria:', err);
        res.status(500).json({ message: 'Erro interno ao buscar registros de auditoria.' });
    }
};

/**
 * Exporta os registros de auditoria filtrados para um arquivo Excel.
 */
const exportarAuditoriaExcel = async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'Acesso negado.' });
    const { id: usuarioIdExecutor, setor_id: setorIdExecutor } = req.user;
    
    const filtros = req.query; 

    try {
        await registrarAuditoria(usuarioIdExecutor, 'RELATORIO_AUDITORIA_EXPORTADO', setorIdExecutor, { ip: req.ip, filtros_aplicados: filtros });
        
        // Passa o perfil do usuário para a função que constrói a query aqui também
        const { sql, params } = construirQueryAuditoria(filtros, req.user);
        const [auditorias] = await db.query(sql, params);
        
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Auditoria');

        worksheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Data/Hora', key: 'data_acao', width: 25 },
            { header: 'Ação', key: 'acao', width: 40 },
            { header: 'Usuário Executor', key: 'usuario_nome', width: 30 },
            { header: 'Setor do Executor', key: 'setor_sigla', width: 20 },
            { header: 'Detalhes', key: 'detalhes', width: 80 },
        ];
        
        const dataForExcel = auditorias.map(log => ({
            ...log,
            data_acao: new Date(log.data_acao).toLocaleString('pt-BR'),
            usuario_nome: log.usuario_nome || 'Sistema',
            setor_sigla: log.setor_sigla || 'N/A'
        }));

        worksheet.addRows(dataForExcel);

        const dataInicio = filtros.data_inicio || 'inicio';
        const dataFim = filtros.data_fim || 'fim';
        const nomeArquivo = `Relatorio_Auditoria_${dataInicio}_a_${dataFim}.xlsx`;

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${nomeArquivo}"`);

        await workbook.xlsx.write(res);
        res.end();

    } catch (err) {
        console.error('Erro ao exportar auditoria:', err);
        await registrarAuditoria(usuarioIdExecutor, 'RELATORIO_AUDITORIA_FALHA', setorIdExecutor, { erro: err.message, ip: req.ip, filtros_aplicados: filtros });
        if (!res.headersSent) {
            res.status(500).json({ message: 'Erro interno ao gerar o relatório de auditoria.' });
        }
    }
};


module.exports = {
    registrarAuditoria,
    listarAuditoria,
    exportarAuditoriaExcel,
};
