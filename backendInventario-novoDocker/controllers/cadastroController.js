// controllers/cadastroController.js

/**
 * --------------------------------------------------------------------
 * 1. DEPENDÊNCIAS
 * --------------------------------------------------------------------
 */
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { registrarAuditoria } = require('./auditoriaController');
// Funções auxiliares, vamos presumir que foram ajustadas para SQL
const { obterSetorIdPorSigla, criarUsuarioEretornarId } = require('./usuarioController');


/**
 * --------------------------------------------------------------------
 * 2. FUNÇÕES DO CONTROLLER
 * --------------------------------------------------------------------
 */

/**
 * Cria uma nova SOLICITAÇÃO de cadastro, que fica com status "pendente".
 * Acessível por Master e Coordenador.
 */
const cadastrarCadastro = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Usuário não autenticado. Acesso negado.' });
    }
 
    const { nome, email, senha, tipo_usuario, sigla_setor, funcao_id } = req.body;
    const quemSolicita = req.user;

    try {
        const setor_id = await obterSetorIdPorSigla(sigla_setor);

        if (quemSolicita.perfil_id === 2 && setor_id !== quemSolicita.setor_id) {
            return res.status(403).json({ message: 'Coordenadores só podem criar solicitações para seu próprio setor.' });
        }

        const perfil_id_cadastro = tipo_usuario === 'COORDENADOR' ? 2 : 3;
        const hashSenha = await bcrypt.hash(senha, 10);

        // ✅ CORREÇÃO APLICADA AQUI: Removida a coluna 'data_solicitacao' e o valor 'NOW()'
        const query = `
            INSERT INTO cadastros (nome, email, setor_id, funcao_id, usuario_id_solicitante, status, senha_hash, tipo_usuario_solicitado, perfil_id_solicitado)
            VALUES (?, ?, ?, ?, ?, 'pendente', ?, ?, ?)
        `;
        const [results] = await db.query(query, [
            nome, email, setor_id, funcao_id, quemSolicita.id, hashSenha, tipo_usuario, perfil_id_cadastro
        ]);

        await registrarAuditoria(quemSolicita.id, 'CADASTRO_SOLICITADO', quemSolicita.setor_id, { novo_cadastro_id: results.insertId, email_solicitado: email, ip: req.ip });

        res.status(201).json({ message: 'Solicitação de cadastro enviada com sucesso e aguardando aprovação.', id: results.insertId });

    } catch (error) {
        console.error('Erro ao solicitar cadastro:', error);
        await registrarAuditoria(quemSolicita.id, 'CADASTRO_SOLICITACAO_FALHA', quemSolicita.setor_id, { erro: error.message, email_solicitado: email, ip: req.ip });

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Já existe uma solicitação ou usuário com este e-mail.' });
        }
        res.status(error.statusCode || 500).json({ message: error.message || 'Erro interno ao processar a solicitação.' });
    }
};

/**
 * Lista todas as solicitações de cadastro com status "pendente".
 */
const listarPendentes = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Usuário não autenticado. Acesso negado.' });
    }
    const { id: usuarioIdExecutor, setor_id: setorIdExecutor, perfil_id: perfilIdExecutor } = req.user;

    try {
        let query = `
            SELECT c.*, s.sigla as setor_sigla 
            FROM cadastros c
            JOIN setores s ON c.setor_id = s.id
            WHERE c.status = 'pendente'
        `;
        const params = [];
        
        if (perfilIdExecutor === 2) {
            query += ' AND c.setor_id = ?';
            params.push(setorIdExecutor);
        }

        const [pendentes] = await db.query(query, params);
        res.status(200).json(pendentes);

    } catch (error) {
        console.error('Erro ao listar cadastros pendentes:', error);
        await registrarAuditoria(usuarioIdExecutor, 'CADASTROS_PENDENTES_LISTAGEM_FALHA', setorIdExecutor, { erro: error.message, ip: req.ip });
        res.status(500).json({ message: 'Erro ao buscar solicitações pendentes.' });
    }
};

/**
 * Aprova uma solicitação de cadastro, criando um novo usuário e atualizando o status do cadastro.
 * Esta operação é uma transação para garantir a integridade dos dados.
 */
const aprovarCadastro = async (req, res) => {
    const idCadastro = req.params.id;
    if (!req.user) {
        return res.status(401).json({ message: 'Usuário não autenticado. Acesso negado.' });
    }
    const quemAprova = req.user;
    
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [[cadastro]] = await connection.query("SELECT * FROM cadastros WHERE id = ? AND status = 'pendente'", [idCadastro]);
        if (!cadastro) {
            await connection.rollback();
            connection.release();
            return res.status(404).json({ message: 'Solicitação de cadastro não encontrada ou já processada.' });
        }

        const novoUsuarioId = await criarUsuarioEretornarId(
            {
                nome: cadastro.nome,
                email: cadastro.email,
                senha: cadastro.senha_hash,
                tipo_usuario: cadastro.tipo_usuario_solicitado,
                perfil_id: cadastro.perfil_id_solicitado,
                setor_id: cadastro.setor_id,
                funcao_id: cadastro.funcao_id
            },
            quemAprova.id,
            quemAprova.setor_id,
            idCadastro,
            connection
        );

        // ✅ CORREÇÃO APLICADA AQUI: Removida a coluna 'data_aprovacao'
        await connection.execute(
            "UPDATE cadastros SET status = 'aprovado', aprovado_por_usuario_id = ?, usuario_criado_id = ? WHERE id = ?",
            [quemAprova.id, novoUsuarioId, idCadastro]
        );

        await connection.commit();

        await registrarAuditoria(quemAprova.id, 'CADASTRO_APROVADO', quemAprova.setor_id, { cadastro_id: idCadastro, novo_usuario_id: novoUsuarioId, ip: req.ip });

        res.status(200).json({ message: 'Cadastro aprovado e usuário criado com sucesso!', usuarioId: novoUsuarioId });

    } catch (error) {
        await connection.rollback();
        console.error('Erro ao aprovar cadastro (transação revertida):', error);
        await registrarAuditoria(quemAprova.id, 'APROVACAO_CADASTRO_FALHA', quemAprova.setor_id, { erro: error.message, cadastro_id: idCadastro, ip: req.ip });
        res.status(500).json({ message: 'Erro interno ao aprovar cadastro. A operação foi revertida.' });
    } finally {
        if (connection) connection.release();
    }
};

/**
 * Rejeita uma solicitação de cadastro.
 */
const rejeitarCadastro = async (req, res) => {
    const idCadastro = req.params.id;
    if (!req.user) {
        return res.status(401).json({ message: 'Usuário não autenticado. Acesso negado.' });
    }
    const quemRejeita = req.user;

    try {
        const [result] = await db.execute("UPDATE cadastros SET status = 'rejeitado' WHERE id = ? AND status = 'pendente'", [idCadastro]);

        if(result.affectedRows === 0) {
            return res.status(404).json({ message: 'Solicitação não encontrada ou já processada.'});
        }

        await registrarAuditoria(quemRejeita.id, 'CADASTRO_REJEITADO', quemRejeita.setor_id, { cadastro_id: idCadastro, ip: req.ip });
        res.status(200).json({ message: 'Solicitação de cadastro rejeitada com sucesso.' });

    } catch (error) {
        console.error('Erro ao rejeitar cadastro:', error);
        await registrarAuditoria(quemRejeita.id, 'CADASTRO_REJEICAO_FALHA', quemRejeita.setor_id, { erro: error.message, cadastro_id: idCadastro, ip: req.ip });
        res.status(500).json({ message: 'Erro ao rejeitar solicitação.' });
    }
}


module.exports = {
    cadastrarCadastro,
    aprovarCadastro,
    rejeitarCadastro,
    listarPendentes,
};