// controllers/usuarioController.js

/**
 * --------------------------------------------------------------------
 * 1. DEPENDÊNCIAS
 * --------------------------------------------------------------------
 */
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); // Pode ser removido se 'login' for o único lugar que o usa aqui
const { registrarAuditoria } = require('./auditoriaController');
const transporter = require('../config/mailer');
const ExcelJS = require('exceljs');


/**
 * --------------------------------------------------------------------
 * 2. FUNÇÃO DE SOLICITAÇÃO DE ACESSO
 * --------------------------------------------------------------------
 */
const solicitarAcesso = async (req, res) => {
    const { nome, email, senha, setor_id, funcao_id } = req.body;

    try {
        const [existente] = await db.query('SELECT id FROM usuarios WHERE email = ?', [email]);
        if (existente.length > 0) {
            return res.status(409).json({ message: 'Este endereço de e-mail já está cadastrado.' });
        }

        const senhaHash = await bcrypt.hash(senha, 10);

        const query = `
            INSERT INTO usuarios (nome, email, senha_hash, tipo_usuario, perfil_id, setor_id, funcao_id, status, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'pendente', NOW(), NOW())
        `;
        const [results] = await db.execute(query, [nome, email, senhaHash, 'interno', 3, setor_id, funcao_id]);
        
        res.status(201).json({ message: 'Solicitação de acesso enviada com sucesso! Aguarde a aprovação de um administrador.' });

    } catch (error) {
        console.error('Erro ao solicitar acesso:', error);
        res.status(500).json({ message: 'Erro interno ao processar sua solicitação.' });
    }
};


/**
 * --------------------------------------------------------------------
 * 3. DEMAIS FUNÇÕES DO CONTROLLER
 * --------------------------------------------------------------------
 */

async function obterSetorIdPorSigla(sigla) {
    if (!sigla) {
        const err = new Error('A sigla do setor é obrigatória.');
        err.statusCode = 400;
        throw err;
    }
    try {
        const [rows] = await db.query('SELECT id FROM setores WHERE sigla = ?', [sigla.toUpperCase()]);
        if (rows.length === 0) {
            const err = new Error('Setor inválido ou sigla não encontrada.');
            err.statusCode = 404;
            throw err;
        }
        return rows[0].id;
    } catch (error) {
        console.error("Erro interno em obterSetorIdPorSigla:", error);
        throw error;
    }
}

function construirQueryListagem(filtros, perfilExecutor) {
    let sql = `
        SELECT 
            u.id, u.nome, u.email, u.perfil_id, u.tipo_usuario, u.status,
            u.createdAt, u.updatedAt, u.setor_id,
            s.sigla AS sigla_setor, s.nome AS nome_setor, 
            f.nome AS funcao_nome
        FROM usuarios u 
        LEFT JOIN setores s ON u.setor_id = s.id
        LEFT JOIN funcoes f ON u.funcao_id = f.id
    `;
    const params = [];
    let whereClauses = [];

    if (perfilExecutor.perfil_id === 2) {
        whereClauses.push(`u.setor_id = ?`);
        params.push(perfilExecutor.setor_id);
    }
    if (filtros.termo_busca) {
        const termo = `%${filtros.termo_busca}%`;
        whereClauses.push(`(u.nome LIKE ? OR u.email LIKE ? OR s.sigla LIKE ?)`);
        params.push(termo, termo, termo);
    }
    if(filtros.status) {
        whereClauses.push('u.status = ?');
        params.push(filtros.status);
    }
    if (whereClauses.length > 0) {
        sql += ` WHERE ${whereClauses.join(' AND ')}`;
    }
    sql += ' ORDER BY u.nome ASC';
    
    return { sql, params };
}

const criarUsuarioEretornarId = async (dadosUsuario, quemAprovaId, quemAprovaSetorId, idCadastroOriginal, connection) => {
    const { nome, email, senha, tipo_usuario, perfil_id, setor_id, funcao_id, status = 'ativo' } = dadosUsuario;
    const dbExecutor = connection || db;
    const senhaHash = senha;

    const query = `
        INSERT INTO usuarios (nome, email, senha_hash, tipo_usuario, perfil_id, setor_id, funcao_id, status, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    try {
        const [results] = await dbExecutor.execute(query, [nome, email, senhaHash, tipo_usuario, perfil_id, setor_id, funcao_id, status]);
        const novoUsuarioId = results.insertId;
        await registrarAuditoria(quemAprovaId, 'USUARIO_CRIADO_APOS_APROVACAO', quemAprovaSetorId, { novo_usuario_id: novoUsuarioId, email, cadastro_id_origem: idCadastroOriginal });
        return novoUsuarioId;
    } catch (error) {
        console.error("Erro ao criar usuário (via aprovação de cadastro):", error);
        await registrarAuditoria(quemAprovaId, 'USUARIO_CRIACAO_APOS_APROVACAO_FALHA', quemAprovaSetorId, { email, cadastro_id_origem: idCadastroOriginal, erro: error.message });
        throw error;
    }
};

const listarUsuarios = async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'Acesso negado.' });
    const { id: usuarioIdExecutor, setor_id: setorIdExecutor } = req.user;
    
    try {
        await registrarAuditoria(usuarioIdExecutor, 'USUARIOS_LISTADOS', setorIdExecutor, { filtros_aplicados: req.query, ip: req.ip });
        const { sql, params } = construirQueryListagem(req.query, req.user);
        const [results] = await db.query(sql, params);
        res.status(200).json(results);
    } catch (err) {
        console.error('Erro ao listar usuários:', err);
        await registrarAuditoria(usuarioIdExecutor, 'USUARIOS_LISTAGEM_FALHA', setorIdExecutor, { erro: err.message, ip: req.ip });
        res.status(500).json({ message: 'Erro interno ao listar usuários.' });
    }
};

const buscarUsuarioPorId = async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'Acesso negado.' });
    const idBuscado = req.params.id;
    const { id: usuarioIdExecutor, setor_id: setorIdExecutor, perfil_id: perfilIdExecutor } = req.user;
    
    try {
        const query = `
            SELECT 
                u.id, u.nome, u.email, u.perfil_id, u.tipo_usuario, u.status, u.setor_id, u.funcao_id,
                s.nome as setor_nome, s.sigla AS sigla_setor, f.nome AS funcao_nome
            FROM usuarios u 
            LEFT JOIN setores s ON u.setor_id = s.id
            LEFT JOIN funcoes f ON u.funcao_id = f.id
            WHERE u.id = ?
        `;
        const [[usuario]] = await db.query(query, [idBuscado]);
        if (!usuario) return res.status(404).json({ message: 'Usuário não encontrado.' });
        
        if (perfilIdExecutor === 2 && usuario.setor_id !== setorIdExecutor) {
            await registrarAuditoria(usuarioIdExecutor, 'USUARIO_BUSCA_NEGADA_OUTRO_SETOR', setorIdExecutor, { usuario_buscado_id: idBuscado, ip: req.ip });
            return res.status(403).json({ message: 'Acesso negado. Coordenadores só podem visualizar usuários do seu setor.' });
        }
        res.status(200).json(usuario);
    } catch (err) {
        console.error('Erro ao buscar usuário por ID:', err);
        await registrarAuditoria(usuarioIdExecutor, 'USUARIO_BUSCA_FALHA', setorIdExecutor, { erro: err.message, usuario_buscado_id: idBuscado, ip: req.ip });
        res.status(500).json({ message: 'Erro interno ao buscar usuário.' });
    }
};

const criarUsuario = async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'Acesso negado.' });
    const { id: usuarioIdExecutor, setor_id: setorIdExecutor } = req.user;
    const { nome, email, senha, tipo_usuario, perfil_id, sigla_setor, funcao_id, status = 'ativo' } = req.body;

    try {
        if (!nome || !email || !senha || !perfil_id || !sigla_setor || !funcao_id) {
            return res.status(400).json({ message: 'Todos os campos obrigatórios devem ser preenchidos.' });
        }
        const setor_id = await obterSetorIdPorSigla(sigla_setor);
        const hashSenha = await bcrypt.hash(senha, 10);
        
        const query = `
            INSERT INTO usuarios (nome, email, senha_hash, tipo_usuario, perfil_id, setor_id, funcao_id, status, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `;
        const [results] = await db.execute(query, [nome, email, hashSenha, tipo_usuario, perfil_id, setor_id, funcao_id, status]);
        await registrarAuditoria(usuarioIdExecutor, 'USUARIO_CRIADO_DIRETAMENTE', setorIdExecutor, { novo_usuario_id: results.insertId, ip: req.ip });
        res.status(201).json({ message: 'Usuário criado com sucesso!', id: results.insertId });
    } catch (error) {
        console.error('Erro ao criar usuário:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Email já cadastrado.' });
        }
        await registrarAuditoria(usuarioIdExecutor, 'USUARIO_CRIACAO_FALHA', setorIdExecutor, { erro: error.message, email_tentativa: email, ip: req.ip });
        res.status(error.statusCode || 500).json({ message: error.message || 'Erro interno ao criar usuário.' });
    }
};

const atualizarUsuario = async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'Acesso negado.' });
    const usuarioIdParaAtualizar = req.params.id;
    const dadosAtualizacao = req.body;
    const quemAtualiza = req.user;

    try {
        const [[usuarioAntigo]] = await db.query('SELECT * FROM usuarios WHERE id = ?', [usuarioIdParaAtualizar]);
        if (!usuarioAntigo) return res.status(404).json({ message: 'Usuário a ser atualizado não encontrado.' });
        
        if (quemAtualiza.perfil_id === 2 && usuarioAntigo.setor_id !== quemAtualiza.setor_id) {
            await registrarAuditoria(quemAtualiza.id, 'TENTATIVA_ATUALIZAR_USUARIO_OUTRO_SETOR', quemAtualiza.setor_id, { ip: req.ip });
            return res.status(403).json({ message: 'Coordenadores só podem editar usuários do seu próprio setor.' });
        }

        const camposParaAtualizar = {};
        if (dadosAtualizacao.nome) camposParaAtualizar.nome = dadosAtualizacao.nome;
        if (dadosAtualizacao.email) camposParaAtualizar.email = dadosAtualizacao.email;
        if (dadosAtualizacao.perfil_id) camposParaAtualizar.perfil_id = dadosAtualizacao.perfil_id;
        if (dadosAtualizacao.status) camposParaAtualizar.status = dadosAtualizacao.status;
        if (dadosAtualizacao.funcao_id) camposParaAtualizar.funcao_id = dadosAtualizacao.funcao_id;
        if (dadosAtualizacao.tipo_usuario) camposParaAtualizar.tipo_usuario = dadosAtualizacao.tipo_usuario;
        if (dadosAtualizacao.setor_id) {
            camposParaAtualizar.setor_id = dadosAtualizacao.setor_id;
        } else if (dadosAtualizacao.sigla_setor) {
            camposParaAtualizar.setor_id = await obterSetorIdPorSigla(dadosAtualizacao.sigla_setor);
        }
        if (dadosAtualizacao.senha && dadosAtualizacao.senha.trim() !== '') {
            camposParaAtualizar.senha_hash = await bcrypt.hash(dadosAtualizacao.senha, 10);
        }

        if (Object.keys(camposParaAtualizar).length === 0) {
            return res.status(400).json({ message: 'Nenhum dado válido fornecido para atualização.' });
        }

        const setClause = Object.keys(camposParaAtualizar).map(key => `${key} = ?`).join(', ');
        const valores = Object.values(camposParaAtualizar);
        
        const query = `UPDATE usuarios SET ${setClause}, updatedAt = NOW() WHERE id = ?`;
        await db.execute(query, [...valores, usuarioIdParaAtualizar]);

        await registrarAuditoria(quemAtualiza.id, 'USUARIO_ATUALIZADO', quemAtualiza.setor_id, { usuario_id_atualizado: usuarioIdParaAtualizar, dados_alterados: Object.keys(camposParaAtualizar), ip: req.ip });
        res.json({ message: 'Usuário atualizado com sucesso.' });
    } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        await registrarAuditoria(quemAtualiza.id, 'USUARIO_ATUALIZACAO_FALHA', quemAtualiza.setor_id, { erro: error.message, ip: req.ip });
        const errorMessage = error.statusCode ? error.message : 'Erro interno ao atualizar usuário.';
        res.status(error.statusCode || 500).json({ message: errorMessage });
    }
};

const excluirUsuario = async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'Acesso negado.' });
    const usuarioIdParaExcluir = req.params.id;
    const quemExclui = req.user;
    
    try {
        if (parseInt(usuarioIdParaExcluir) === quemExclui.id) {
            return res.status(400).json({ message: 'Não é permitido se auto-excluir.' });
        }
        
        const [[usuarioParaExcluir]] = await db.query('SELECT * FROM usuarios WHERE id = ?', [usuarioIdParaExcluir]);
        if (!usuarioParaExcluir) return res.status(404).json({ message: 'Usuário não encontrado.' });
        
        if (quemExclui.perfil_id !== 1) { // Apenas Master pode excluir
            return res.status(403).json({ message: 'Apenas administradores podem excluir usuários.' });
        }
        
        await db.execute('DELETE FROM usuarios WHERE id = ?', [usuarioIdParaExcluir]);
        await registrarAuditoria(quemExclui.id, 'USUARIO_EXCLUIDO', quemExclui.setor_id, { usuario_id_excluido: usuarioIdParaExcluir, ip: req.ip });
        res.json({ message: 'Usuário excluído com sucesso.' });
    } catch (err) {
        console.error('Erro ao excluir usuário:', err);
        await registrarAuditoria(quemExclui.id, 'USUARIO_EXCLUSAO_FALHA', quemExclui.setor_id, { erro: err.message, ip: req.ip });
        res.status(500).json({ message: 'Erro interno ao excluir usuário.' });
    }
};

const resetarSenha = async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'Acesso negado.' });
    const { id: idUsuarioAlvo } = req.params;
    const { senha: novaSenha } = req.body;
    const { id: idExecutor, setor_id: setorIdExecutor } = req.user;

    try {
        const novaSenhaHash = await bcrypt.hash(novaSenha, 10);

        const [result] = await db.query(
            'UPDATE usuarios SET senha_hash = ?, updatedAt = NOW() WHERE id = ?',
            [novaSenhaHash, idUsuarioAlvo]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        await registrarAuditoria(idExecutor, 'SENHA_REDEFINIDA', setorIdExecutor, { 
            usuario_alvo_id: idUsuarioAlvo, 
            ip: req.ip 
        });

        res.status(200).json({ message: 'Senha do usuário redefinida com sucesso.' });

    } catch (error) {
        console.error('Erro ao redefinir senha:', error);
        await registrarAuditoria(idExecutor, 'SENHA_REDEFINICAO_FALHA', setorIdExecutor, { 
            usuario_alvo_id: idUsuarioAlvo, 
            ip: req.ip,
            erro: error.message 
        });
        res.status(500).json({ message: 'Erro interno ao redefinir a senha.' });
    }
};

const aprovarUsuario = async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'Acesso negado.' });
    const usuarioIdParaAprovar = req.params.id;
    const quemAprova = req.user;

    try {
        const [[usuario]] = await db.query('SELECT * FROM usuarios WHERE id = ?', [usuarioIdParaAprovar]);
        if (!usuario) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }
        if (usuario.status !== 'pendente') {
            return res.status(400).json({ message: 'Este usuário não está com status pendente.' });
        }
        
        if (quemAprova.perfil_id === 2 && usuario.setor_id !== quemAprova.setor_id) {
            return res.status(403).json({ message: 'Coordenadores só podem aprovar usuários do seu próprio setor.' });
        }
        
        // CORREÇÃO DA REGRA DE NEGÓCIO: Ao aprovar, o status muda para 'ativo_inventario_pendente'
        const novoStatus = 'ativo_inventario_pendente';
        await db.execute('UPDATE usuarios SET status = ?, updatedAt = NOW() WHERE id = ?', [novoStatus, usuarioIdParaAprovar]);
        
        await registrarAuditoria(quemAprova.id, 'USUARIO_APROVADO', quemAprova.setor_id, { usuario_id_aprovado: usuarioIdParaAprovar, ip: req.ip, novo_status: novoStatus });
        
        if (usuario.email && transporter) {
            await transporter.sendMail({
                from: `"Sistema de Cadastro" <${process.env.MAIL_USER}>`,
                to: usuario.email,
                subject: 'Seu cadastro foi aprovado!',
                // Mensagem do email atualizada para refletir a necessidade de preencher o inventário
                html: `<p>Olá ${usuario.nome},</p><p>Seu cadastro foi <strong>aprovado</strong>. Para ativar completamente seu acesso, por favor, faça o login e preencha o seu Inventário de Dados Pessoais.</p>`
            });
        }
        res.json({ message: 'Usuário aprovado com sucesso. O próximo passo é o preenchimento do inventário.' });
    } catch (err) {
        console.error('Erro ao aprovar usuário:', err);
        await registrarAuditoria(quemAprova.id, 'USUARIO_APROVACAO_FALHA', quemAprova.setor_id, { erro: err.message, ip: req.ip });
        res.status(500).json({ message: 'Erro interno ao aprovar usuário.' });
    }
};

const rejeitarUsuario = async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'Acesso negado.' });
    const usuarioIdParaRejeitar = req.params.id;
    const quemRejeita = req.user;

    try {
        const [[usuario]] = await db.query('SELECT * FROM usuarios WHERE id = ?', [usuarioIdParaRejeitar]);
        if (!usuario) return res.status(404).json({ message: 'Usuário não encontrado.' });
        if (usuario.status === 'rejeitado') return res.status(400).json({ message: 'Usuário já está rejeitado.' });
        
        if (quemRejeita.perfil_id === 2 && usuario.setor_id !== quemRejeita.setor_id) {
            return res.status(403).json({ message: 'Coordenadores só podem rejeitar usuários do seu próprio setor.' });
        }
        
        await db.execute('UPDATE usuarios SET status = "rejeitado", updatedAt = NOW() WHERE id = ?', [usuarioIdParaRejeitar]);
        await registrarAuditoria(quemRejeita.id, 'USUARIO_REJEITADO', quemRejeita.setor_id, { usuario_id_rejeitado: usuarioIdParaRejeitar, ip: req.ip });
        
        if (usuario.email && transporter) {
            await transporter.sendMail({
                from: `"Sistema de Cadastro" <${process.env.MAIL_USER}>`,
                to: usuario.email,
                subject: 'Atualização sobre seu cadastro',
                html: `<p>Olá ${usuario.nome},</p><p>Sua solicitação de cadastro foi <strong>rejeitada</strong>.</p>`
            });
        }
        res.json({ message: 'Usuário rejeitado com sucesso.' });
    } catch (err) {
        console.error('Erro ao rejeitar usuário:', err);
        await registrarAuditoria(quemRejeita.id, 'USUARIO_REJEICAO_FALHA', quemRejeita.setor_id, { erro: err.message, ip: req.ip });
        res.status(500).json({ message: 'Erro interno ao rejeitar usuário.' });
    }
};

const exportarUsuariosExcel = async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'Acesso negado.' });
    const { id: usuarioIdExecutor, setor_id: setorIdExecutor } = req.user;

    try {
        await registrarAuditoria(usuarioIdExecutor, 'RELATORIO_USUARIOS_EXPORTADO', setorIdExecutor, { formato: 'Excel', ip: req.ip });
        const { sql, params } = construirQueryListagem(req.query, req.user);
        const [usuarios] = await db.query(sql, params);
        
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Lista de Usuários');

        worksheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Nome', key: 'nome', width: 35 },
            { header: 'Email', key: 'email', width: 35 },
            { header: 'Setor', key: 'nome_setor', width: 30 },
            { header: 'Sigla', key: 'sigla_setor', width: 15 },
            { header: 'Função', key: 'funcao_nome', width: 30 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Data de Cadastro', key: 'createdAt', width: 22 },
            { header: 'Última Atualização', key: 'updatedAt', width: 22 },
        ];
        
        const dataForExcel = usuarios.map(u => ({
            ...u,
            createdAt: u.createdAt ? new Date(u.createdAt).toLocaleString('pt-BR') : '',
            updatedAt: u.updatedAt ? new Date(u.updatedAt).toLocaleString('pt-BR') : ''
        }));
        worksheet.addRows(dataForExcel);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=Relatorio_Usuarios.xlsx');
        
        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        console.error('Erro ao exportar usuários para Excel:', err);
        await registrarAuditoria(usuarioIdExecutor, 'RELATORIO_USUARIOS_EXPORTACAO_FALHA', setorIdExecutor, { erro: err.message, ip: req.ip });
        if (!res.headersSent) {
            res.status(500).json({ message: 'Erro interno ao gerar o relatório Excel.' });
        }
    }
};

const listarUsuariosPendentes = (req, res) => {
    res.status(501).json({ message: "Funcionalidade de listar usuários pendentes não implementada neste controller." });
};

/**
 * --------------------------------------------------------------------
 * 5. EXPORTAÇÃO DOS MÓDULOS
 * --------------------------------------------------------------------
 */
module.exports = {
    solicitarAcesso,
    obterSetorIdPorSigla,
    criarUsuarioEretornarId,
    listarUsuarios,
    buscarUsuarioPorId,
    criarUsuario,
    atualizarUsuario,
    excluirUsuario,
    resetarSenha,
    aprovarUsuario,
    rejeitarUsuario,
    exportarUsuariosExcel,
    listarUsuariosPendentes,
};