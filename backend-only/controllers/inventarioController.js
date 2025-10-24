// controllers/inventarioController.js

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
 * 2. FUNÇÕES AUXILIARES
 * --------------------------------------------------------------------
 * Funções para converter campos JSON, garantindo consistência.
 */

const stringifyJsonFields = (data) => {
    const fieldsToStringify = [
        'dados_pessoais_comuns', 'dados_pessoais_sensiveis', 'categorias_titulares',
        'principios_lgpd', 'compartilhamento_detalhes', 'medidas_seguranca'
    ];
    const stringifiedData = { ...data };
    fieldsToStringify.forEach(field => {
        if (stringifiedData[field] && typeof stringifiedData[field] !== 'string') {
            stringifiedData[field] = JSON.stringify(stringifiedData[field]);
        } else if (!stringifiedData[field]) {
            // Garante que campos vazios se tornem um array JSON vazio em string
            stringifiedData[field] = '[]';
        }
    });
    return stringifiedData;
};

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
                // Em caso de erro, define um array vazio para não quebrar a aplicação.
                parsedData[field] = [];
            }
        } else if (!parsedData[field]) {
            parsedData[field] = [];
        }
    });
    return parsedData;
};



const listarInventario = async (req, res) => {
    // Desestruturamos os dados do usuário que o middleware de autenticação nos forneceu
    const { id: usuarioIdExecutor, setor_id: setorIdExecutor, perfil_id: perfilIdExecutor } = req.user;

    try {
        // A base da nossa consulta SQL, selecionando todas as colunas necessárias
        let query = `
            SELECT 
                inv.id, inv.nome_servico, inv.sigla_servico, inv.resumo_atividade,
                inv.diretoria, inv.setor_responsavel, inv.finalidade,
                u.nome as nome_usuario, 
                s.nome as nome_setor
            FROM inventario_lgpd inv
            LEFT JOIN usuarios u ON inv.usuario_id = u.id
            LEFT JOIN setores s ON u.setor_id = s.id
        `;
        const params = [];

        // Se o perfil for Coordenador (ID 2), adicionamos um filtro para ver apenas os do seu setor
        if (perfilIdExecutor === 2) {
            query += ' WHERE u.setor_id = ?';
            params.push(setorIdExecutor);
        }
        // Se for Master (ID 1), nenhum filtro é aplicado, e a query busca TUDO.

        query += ' ORDER BY inv.nome_servico ASC';

        const [inventarios] = await db.query(query, params);
        // Garante que campos que são arrays no frontend sejam tratados corretamente
        const inventariosProcessados = inventarios.map(parseJsonFields);

        res.status(200).json(inventariosProcessados);

    } catch (err) {
        console.error('Erro ao listar inventário LGPD:', err);
        // await registrarAuditoria(usuarioIdExecutor, 'INVENTARIO_GERAL_LISTAGEM_FALHA', setorIdExecutor, { erro: err.message, ip: req.ip });
        res.status(500).json({ message: 'Erro interno ao listar inventários.' });
    }
};

/**
 * Cria ou atualiza o inventário LGPD do usuário logado.
 */
const cadastrarOuAtualizarInventarioUsuario = async (req, res) => {
    const usuario = req.user;
    const dadosDoFrontend = req.body;

    // --- ✅ INÍCIO DA CORREÇÃO ---
    // Mapeamos explicitamente os campos do frontend para as colunas do banco.
    // Isso evita que campos inesperados (como 'tipo_dado') causem erros.
    const dadosParaSalvar = {
        nome_servico: dadosDoFrontend.nome_servico,
        sigla_servico: dadosDoFrontend.sigla_servico,
        resumo_atividade: dadosDoFrontend.resumo_atividade,
        diretoria: dadosDoFrontend.diretoria,
        setor_responsavel: dadosDoFrontend.setor_responsavel,
        controlador: dadosDoFrontend.controlador,
        co_controlador: dadosDoFrontend.co_controlador,
        operador: dadosDoFrontend.operador,
        canal_titular: 'privacidade@iti.gov.br', // Garante o valor fixo
        finalidade: dadosDoFrontend.finalidade,
        hipotese_tratamento: dadosDoFrontend.hipotese_tratamento, // Nome correto da coluna
        periodo_retencao: dadosDoFrontend.periodo_retencao,
        forma_eliminacao: dadosDoFrontend.forma_eliminacao,
        finalidade_compartilhamento: dadosDoFrontend.finalidade_compartilhamento,
        transferencia_internacional: dadosDoFrontend.transferencia_internacional,
        paises_transferencia: dadosDoFrontend.paises_transferencia,
        garantias_transferencia: dadosDoFrontend.garantias_transferencia,
        
        // Campos que são arrays e precisam ser convertidos para string JSON
        dados_pessoais_comuns: JSON.stringify(dadosDoFrontend.dados_pessoais_comuns || []),
        dados_pessoais_sensiveis: JSON.stringify(dadosDoFrontend.dados_pessoais_sensiveis || []),
        categorias_titulares: JSON.stringify(dadosDoFrontend.categorias_titulares || []),
        principios_lgpd: JSON.stringify(dadosDoFrontend.principios_lgpd || []),
        compartilhamento_detalhes: JSON.stringify(dadosDoFrontend.compartilhamento_detalhes || []),
        medidas_seguranca: JSON.stringify(dadosDoFrontend.medidas_seguranca || []),
        
        // Adicionando os campos "outros" que criamos no frontend
        outros_dados_comuns: dadosDoFrontend.outros_dados_comuns,
        outros_dados_sensiveis: dadosDoFrontend.outros_dados_sensiveis,
        outros_categorias_titulares: dadosDoFrontend.outros_categorias_titulares,
    };
    // --- ✅ FIM DA CORREÇÃO ---

    try {
        const [existente] = await db.query('SELECT id FROM inventario_lgpd WHERE usuario_id = ?', [usuario.id]);

        if (existente.length > 0) {
            // Atualiza inventário existente
            const inventarioId = existente[0].id;
            const query = 'UPDATE inventario_lgpd SET ? WHERE id = ?';
            await db.query(query, [dadosParaSalvar, inventarioId]);
            await registrarAuditoria(usuario.id, 'INVENTARIO_LGPD_ATUALIZADO', usuario.setor_id, { inventario_id: inventarioId, ip: req.ip });
            return res.status(200).json({ message: 'Seu inventário foi atualizado com sucesso.', id: inventarioId });
        } else {
            // Cria novo inventário
            dadosParaSalvar.usuario_id = usuario.id; // Adiciona o ID do usuário
            const query = 'INSERT INTO inventario_lgpd SET ?';
            const [resultado] = await db.query(query, dadosParaSalvar);
            const novoIdGerado = resultado.insertId;
            await registrarAuditoria(usuario.id, 'INVENTARIO_LGPD_CRIADO', usuario.setor_id, { inventario_id: novoIdGerado, ip: req.ip });
            return res.status(201).json({ message: 'Seu inventário foi cadastrado com sucesso.', id: novoIdGerado });
        }
    } catch (err) {
        console.error('Erro ao cadastrar/atualizar inventário do usuário:', err);
        await registrarAuditoria(usuario.id, 'INVENTARIO_LGPD_OPERACAO_FALHA', usuario.setor_id, { erro: err.sqlMessage || err.message, ip: req.ip });
        return res.status(500).json({ message: 'Erro ao processar seu inventário.', detalhe: err.sqlMessage || err.message });
    }
};

/**
 * Exporta os dados do inventário para um arquivo Excel.
 */
const exportarInventarioExcel = async (req, res) => {
    const { id: usuarioIdExecutor, setor_id: setorIdExecutor, perfil_id: perfilIdExecutor } = req.user;

    try {
        await registrarAuditoria(usuarioIdExecutor, 'INVENTARIO_EXPORTACAO_INICIADA', setorIdExecutor, { ip: req.ip });

        let query = `
            SELECT 
                inv.id, inv.nome_servico, inv.sigla_servico, inv.resumo_atividade,
                inv.diretoria, inv.setor_responsavel, inv.controlador, inv.co_controlador, 
                inv.operador, inv.canal_titular, inv.finalidade, inv.hipotese_tratamento,
                inv.dados_pessoais_comuns, inv.outros_dados_comuns, 
                inv.dados_pessoais_sensiveis, inv.outros_dados_sensiveis,
                inv.categorias_titulares, inv.outros_categorias_titulares,
                inv.principios_lgpd, inv.compartilhamento_detalhes, inv.finalidade_compartilhamento,
                inv.transferencia_internacional, inv.paises_transferencia, inv.garantias_transferencia,
                inv.medidas_seguranca, inv.periodo_retencao, inv.forma_eliminacao,
                inv.usuario_id, 
                u.nome AS nome_usuario, s.nome AS nome_setor, s.sigla AS sigla_setor,
                inv.createdAt AS criado_em, 
                inv.updatedAt AS data_atualizacao
            FROM inventario_lgpd inv 
            LEFT JOIN usuarios u ON inv.usuario_id = u.id
            LEFT JOIN setores s ON u.setor_id = s.id
        `;
        
        const params = [];
        if(perfilIdExecutor === 2) { // Filtro para Coordenador
            query += ' WHERE u.setor_id = ?';
            params.push(setorIdExecutor);
        }

        query += ' ORDER BY inv.id ASC';

        const [inventarios] = await db.query(query, params);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Inventario_LGPD');

        worksheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Nome do Serviço', key: 'nome_servico', width: 30 },
            { header: 'Sigla', key: 'sigla_servico', width: 15 },
            { header: 'Resumo da Atividade', key: 'resumo_atividade', width: 50 },
            { header: 'Diretoria', key: 'diretoria', width: 20 },
            { header: 'Setor Responsável', key: 'setor_responsavel', width: 30 },
            { header: 'Controlador', key: 'controlador', width: 30 },
            { header: 'Co-controlador', key: 'co_controlador', width: 30 },
            { header: 'Operador', key: 'operador', width: 30 },
            { header: 'Canal do Titular', key: 'canal_titular', width: 30 },
            { header: 'Finalidade', key: 'finalidade', width: 50 },
            { header: 'Hipótese de Tratamento', key: 'hipotese_tratamento', width: 30 },
            { header: 'Dados Pessoais Comuns', key: 'dados_pessoais_comuns', width: 50 },
            { header: 'Outros Dados Comuns', key: 'outros_dados_comuns', width: 40 },
            { header: 'Dados Pessoais Sensíveis', key: 'dados_pessoais_sensiveis', width: 50 },
            { header: 'Outros Dados Sensíveis', key: 'outros_dados_sensiveis', width: 40 },
            { header: 'Categorias de Titulares', key: 'categorias_titulares', width: 40 },
            { header: 'Outras Categorias Titulares', key: 'outros_categorias_titulares', width: 40 },
            { header: 'Princípios LGPD Aplicados', key: 'principios_lgpd', width: 40 },
            { header: 'Detalhes de Compartilhamento', key: 'compartilhamento_detalhes', width: 50 },
            { header: 'Finalidade do Compartilhamento', key: 'finalidade_compartilhamento', width: 50 },
            { header: 'Transferência Internacional', key: 'transferencia_internacional', width: 25 },
            { header: 'Países de Transferência', key: 'paises_transferencia', width: 30 },
            { header: 'Garantias da Transferência', key: 'garantias_transferencia', width: 40 },
            { header: 'Medidas de Segurança', key: 'medidas_seguranca', width: 50 },
            { header: 'Período de Retenção', key: 'periodo_retencao', width: 30 },
            { header: 'Forma de Eliminação', key: 'forma_eliminacao', width: 30 },
            { header: 'Responsável (Usuário)', key: 'nome_usuario', width: 30 },
            { header: 'Setor do Responsável', key: 'nome_setor', width: 30 },
            { header: 'Data de Criação', key: 'criado_em', width: 20 },
            { header: 'Última Atualização', key: 'data_atualizacao', width: 20 },
        ];
        
        const dataForExcel = inventarios.map(item => {
            const parsedItem = parseJsonFields(item);
            
            // Junta os dados de "Outros" com os dados principais para o Excel
            if (parsedItem.dados_pessoais_comuns.includes('Outros') && parsedItem.outros_dados_comuns) {
                const outrosIndex = parsedItem.dados_pessoais_comuns.indexOf('Outros');
                parsedItem.dados_pessoais_comuns[outrosIndex] = `Outros: ${parsedItem.outros_dados_comuns}`;
            }
             if (parsedItem.dados_pessoais_sensiveis.includes('Outros') && parsedItem.outros_dados_sensiveis) {
                const outrosIndex = parsedItem.dados_pessoais_sensiveis.indexOf('Outros');
                parsedItem.dados_pessoais_sensiveis[outrosIndex] = `Outros: ${parsedItem.outros_dados_sensiveis}`;
            }
            if (parsedItem.categorias_titulares.includes('Outros') && parsedItem.outros_categorias_titulares) {
                const outrosIndex = parsedItem.categorias_titulares.indexOf('Outros');
                parsedItem.categorias_titulares[outrosIndex] = `Outros: ${parsedItem.outros_categorias_titulares}`;
            }

            // Formata campos de array para uma string legível no Excel
            Object.keys(parsedItem).forEach(key => {
                if(Array.isArray(parsedItem[key])) {
                    parsedItem[key] = parsedItem[key].join(', ');
                }
            });

            // Formata as datas
            parsedItem.criado_em = parsedItem.criado_em ? new Date(parsedItem.criado_em).toLocaleString('pt-BR') : '';
            parsedItem.data_atualizacao = parsedItem.data_atualizacao ? new Date(parsedItem.data_atualizacao).toLocaleString('pt-BR') : '';
            return parsedItem;
        });

        worksheet.addRows(dataForExcel);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=Relatorio_Inventario_LGPD.xlsx');
        
        await workbook.xlsx.write(res);
        await registrarAuditoria(usuarioIdExecutor, 'INVENTARIO_EXPORTACAO_SUCESSO', setorIdExecutor, { ip: req.ip });
        res.end();

    } catch (err) {
        console.error('Erro ao exportar inventário para Excel:', err);
        await registrarAuditoria(usuarioIdExecutor, 'INVENTARIO_EXPORTACAO_FALHA', setorIdExecutor, { erro: err.message, ip: req.ip });
        if (!res.headersSent) {
            res.status(500).json({ message: 'Erro interno ao gerar o relatório Excel.' });
        }
    }
};


module.exports = {
    listarInventario,
    cadastrarOuAtualizarInventarioUsuario,
    exportarInventarioExcel,
};