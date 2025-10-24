// controllers/cadastroController.js

const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { registrarAuditoria } = require('./auditoriaController');
const { obterSetorIdPorSigla, criarUsuarioEretornarId } = require('./usuarioController');

/**
 * Cria uma nova SOLICITAÇÃO de cadastro, que fica com status "pendente".
 */
const cadastrarCadastro = async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'Usuário não autenticado.' });

    const { nome, email, senha, tipo_usuario, sigla_setor, funcao_id } = req.body;
    const quemSolicita = req.user;

    try {
        const setor_id = await obterSetorIdPorSigla(sigla_setor);
        if (quemSolicita.perfil_id === 2 && setor_id !== quemSolicita.setor_id) {
            return res.status(403).json({ message: 'Coordenadores só podem criar solicitações para seu próprio setor.' });
        }

        const perfil_id_cadastro = tipo_usuario === 'COORDENADOR' ? 2 : 3;
        const hashSenha = await bcrypt.hash(senha, 10);

        const query = `
            INSERT INTO cadastros (nome, email, setor_id, funcao_id, usuario_id_solicitante, status, senha_hash, tipo_usuario_solicitado, perfil_id_solicitado)
            VALUES (?, ?, ?, ?, ?, 'pendente', ?, ?, ?)
        `;
        const [results] = await db.query(query, [
            nome, email, setor_id, funcao_id, quemSolicita.id, hashSenha, tipo_usuario, perfil_id_cadastro
        ]);

        await registrarAuditoria(quemSolicita.id, 'CADASTRO_SOLICITADO', quemSolicita.setor_id, {
            novo_cadastro_id: results.insertId, email_solicitado: email, ip: req.ip
        });

        res.status(201).json({ message: 'Solicitação de cadastro enviada com sucesso e aguardando aprovação.', id: results.insertId });

    } catch (error) {
        console.error('Erro ao solicitar cadastro:', error);
        await registrarAuditoria(quemSolicita.id, 'CADASTRO_SOLICITACAO_FALHA', quemSolicita.setor_id, {
            erro: error.message, email_solicitado: email, ip: req.ip
        });

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Já existe uma solicitação ou usuário com este e-mail.' });
        }
        res.status(error.statusCode || 500).json({ message: error.message || 'Erro interno.' });
    }
};

/**
 * Cadastra um Coordenador diretamente, sem necessidade de aprovação.
 */
const cadastrarCoordenadorDireto = async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'Usuário não autenticado.' });

    const { nome, email, senha, sigla_setor, funcao_id } = req.body;
    const quemSolicita = req.user;

    try {
        const setor_id = await obterSetorIdPorSigla(sigla_setor);
        if (quemSolicita.perfil_id === 2 && setor_id !== quemSolicita.setor_id) {
            return res.status(403).json({ message: 'Coordenadores só podem criar usuários para seu próprio setor.' });
        }

        const hashSenha = await bcrypt.hash(senha, 10);

        const novoUsuarioId = await criarUsuarioEretornarId({
            nome,
            email,
            senha: hashSenha,
            tipo_usuario: 'COORDENADOR',
            perfil_id: 2,
            setor_id,
            funcao_id,
            status: 'ativo'
        }, quemSolicita.id, quemSolicita.setor_id);

        await registrarAuditoria(quemSolicita.id, 'COORDENADOR_CRIADO_DIRETO', quemSolicita.setor_id, {
            novo_usuario_id: novoUsuarioId, email_solicitado: email, ip: req.ip
        });

        res.status(201).json({ message: 'Coordenador criado com sucesso!', id: novoUsuarioId });

    } catch (error) {
        console.error('Erro ao cadastrar Coordenador diretamente:', error);
        await registrarAuditoria(quemSolicita.id, 'COORDENADOR_CADASTRO_FALHA', quemSolicita.setor_id, {
            erro: error.message, email_solicitado: email, ip: req.ip
        });

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Já existe um usuário com este e-mail.' });
        }
        res.status(error.statusCode || 500).json({ message: error.message || 'Erro interno.' });
    }
};

/**
 * Aprovar cadastro pendente e criar usuário ativo
 */
const aprovarCadastro = async (req, res) => {
    const { id } = req.params; // id do cadastro
    const quemAprova = req.user;

    try {
        // Buscar cadastro pendente
        const [cadastros] = await db.query('SELECT * FROM cadastros WHERE id = ? AND status = "pendente"', [id]);
        if (cadastros.length === 0) return res.status(404).json({ message: 'Cadastro não encontrado ou já processado.' });

        const cadastro = cadastros[0];

        // Criar usuário na tabela usuarios
        const novoUsuarioId = await criarUsuarioEretornarId({
            nome: cadastro.nome,
            email: cadastro.email,
            senha: cadastro.senha_hash,
            tipo_usuario: cadastro.tipo_usuario_solicitado,
            perfil_id: cadastro.perfil_id_solicitado,
            setor_id: cadastro.setor_id,
            funcao_id: cadastro.funcao_id,
            status: 'ativo'
        }, quemAprova.id, quemAprova.setor_id);

        // Atualizar status do cadastro
        await db.query('UPDATE cadastros SET status = "aprovado" WHERE id = ?', [id]);

        await registrarAuditoria(quemAprova.id, 'CADASTRO_APROVADO', quemAprova.setor_id, { cadastro_id: id, novo_usuario_id: novoUsuarioId, ip: req.ip });

        res.json({ message: 'Cadastro aprovado e usuário criado com sucesso.' });

    } catch (error) {
        console.error('Erro ao aprovar cadastro:', error);
        res.status(500).json({ message: 'Erro ao aprovar cadastro.' });
    }
};

/**
 * Rejeitar cadastro pendente
 */
const rejeitarCadastro = async (req, res) => {
    const { id } = req.params;
    const quemRejeita = req.user;

    try {
        await db.query('UPDATE cadastros SET status = "rejeitado" WHERE id = ?', [id]);
        await registrarAuditoria(quemRejeita.id, 'CADASTRO_REJEITADO', quemRejeita.setor_id, { cadastro_id: id, ip: req.ip });

        res.json({ message: 'Cadastro rejeitado com sucesso.' });
    } catch (error) {
        console.error('Erro ao rejeitar cadastro:', error);
        res.status(500).json({ message: 'Erro ao rejeitar cadastro.' });
    }
};

/**
 * Listar cadastros pendentes
 */
const listarPendentes = async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM cadastros WHERE status = "pendente"');
        res.json(results);
    } catch (error) {
        console.error('Erro ao listar cadastros pendentes:', error);
        res.status(500).json({ message: 'Erro ao listar cadastros pendentes.' });
    }
};

module.exports = {
    cadastrarCadastro,
    cadastrarCoordenadorDireto,
    aprovarCadastro,
    rejeitarCadastro,
    listarPendentes
};
