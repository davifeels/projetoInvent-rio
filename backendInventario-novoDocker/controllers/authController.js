// controllers/authController.js

const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { registrarAuditoria } = require('./auditoriaController');

// ==============================
// LOGIN
// ==============================
const login = async (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
    }

    try {
        const query = `
            SELECT 
                u.id, u.nome, u.email, u.senha_hash, u.perfil_id, u.status, u.setor_id,
                s.nome AS setor_nome, s.sigla AS sigla_setor
            FROM usuarios u
            LEFT JOIN setores s ON u.setor_id = s.id
            WHERE u.email = ?
        `;
        const [rows] = await db.query(query, [email]);
        const usuario = rows[0];

        if (!usuario) {
            await registrarAuditoria(null, 'LOGIN_FALHA_EMAIL_NAO_ENCONTRADO', null, { email_tentativa: email, ip: req.ip });
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

        if (usuario.status !== 'ativo') {
            await registrarAuditoria(usuario.id, 'LOGIN_FALHA_USUARIO_NAO_ATIVO', usuario.setor_id, {
                email_tentativa: email,
                status_usuario: usuario.status,
                ip: req.ip
            });
            return res.status(403).json({ message: `Acesso negado. Status do usuário: ${usuario.status}.` });
        }

        const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
        if (!senhaValida) {
            await registrarAuditoria(usuario.id, 'LOGIN_FALHA_SENHA_INCORRETA', usuario.setor_id, {
                email_tentativa: email,
                ip: req.ip
            });
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

        const payload = {
            id: usuario.id,
            nome: usuario.nome, // 👈 ESSA LINHA É FUNDAMENTAL
            perfil_id: usuario.perfil_id,
            setor_id: usuario.setor_id,
            setor_nome: usuario.setor_nome,
            sigla_setor: usuario.sigla_setor
        };


        const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });
        const refreshToken = jwt.sign({ id: usuario.id }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, { expiresIn: '7d' });

        await registrarAuditoria(usuario.id, 'LOGIN_SUCESSO', usuario.setor_id, { ip: req.ip });

        res.json({
            message: "Login realizado com sucesso!",
            accessToken,
            refreshToken,
            usuario: payload
        });

    } catch (error) {
        console.error('Erro no servidor durante o login:', error);
        await registrarAuditoria(null, 'LOGIN_FALHA_ERRO_INTERNO', null, {
            email_tentativa: email,
            erro: error.message,
            ip: req.ip
        });
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
};

// ==============================
// REFRESH TOKEN
// ==============================
const refreshToken = async (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(401).json({ message: 'Token de atualização não fornecido.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);

        const query = `
            SELECT 
                u.id, u.nome, u.email, u.perfil_id, u.status, u.setor_id,
                s.nome AS setor_nome, s.sigla AS sigla_setor
            FROM usuarios u
            LEFT JOIN setores s ON u.setor_id = s.id
            WHERE u.id = ? AND u.status = 'ativo'
        `;
        const [rows] = await db.query(query, [decoded.id]);
        const usuario = rows[0];

        if (!usuario) {
            return res.status(403).json({ message: 'Usuário não encontrado ou inativo.' });
        }

        const newAccessToken = jwt.sign({
            id: usuario.id,
            nome: usuario.nome,
            perfil_id: usuario.perfil_id,
            setor_id: usuario.setor_id,
            setor_nome: usuario.setor_nome,
            sigla_setor: usuario.sigla_setor
        }, process.env.JWT_SECRET, { expiresIn: '8h' });

        res.json({ accessToken: newAccessToken });
    } catch (error) {
        return res.status(403).json({ message: 'Token de atualização inválido ou expirado.' });
    }
};

// ==============================
// LIMPAR TOKENS (placeholder)
// ==============================
const limparTokensExpirados = async (req, res) => {
    const quemExecuta = req.usuario;

    try {
        const quantidadeRemovida = 0; // A lógica real deve ser implementada depois

        await registrarAuditoria(quemExecuta.id, 'LIMPEZA_TOKENS_EXECUTADA', quemExecuta.setor_id, {
            quantidade_removida: quantidadeRemovida,
            ip: req.ip
        });

        res.status(200).json({
            message: 'Funcionalidade de limpar tokens a ser implementada. Nenhum token removido.',
            removidos: quantidadeRemovida
        });
    } catch (err) {
        console.error('Erro ao limpar tokens expirados:', err);

        await registrarAuditoria(quemExecuta.id, 'LIMPEZA_TOKENS_FALHA', quemExecuta.setor_id, {
            erro: err.message,
            ip: req.ip
        });

        res.status(500).json({ message: 'Erro interno ao tentar limpar tokens.' });
    }
};

// ==============================
// REQUEST ACCESS (Solicitação de Acesso)
// ==============================
const requestAccess = async (req, res) => {
    console.log('✅ Chegou na função requestAccess!'); // <-- LOG DE DEPURAÇÃO
    console.log('Dados recebidos:', req.body); // <-- LOG DE DEPURAÇÃO

    const { nome, email, senha, setor_id, funcao_id } = req.body;

    if (!nome || !email || !senha || !setor_id || !funcao_id) { // ✅ Adicionando validação básica de campos
        console.error('❌ requestAccess: Campos obrigatórios faltando.');
        return res.status(400).json({ message: 'Todos os campos são obrigatórios para a solicitação de acesso.' });
    }

    try {
        const [existente] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);
        if (existente.length > 0) {
            console.warn('⚠️ requestAccess: Tentativa de cadastrar email já existente:', email);
            return res.status(400).json({ message: 'Já existe uma solicitação ou conta com este e-mail.' });
        }

        const senhaHash = await bcrypt.hash(senha, 10);

        await db.query(`
            INSERT INTO usuarios (nome, email, senha_hash, setor_id, funcao_id, status, perfil_id)
            VALUES (?, ?, ?, ?, ?, 'pendente', 3)
        `, [nome, email, senhaHash, setor_id, funcao_id]);

        console.log('🎉 requestAccess: Solicitação de acesso enviada com sucesso para:', email);
        res.status(201).json({ message: 'Solicitação enviada com sucesso! Aguarde aprovação.' });
    } catch (error) {
        console.error('❌ Erro interno no servidor durante a solicitação de acesso:', error); // <-- LOG DE ERRO DETALHADO
        // Se o erro estiver vindo do registrarAuditoria, ou de um erro de DB
        res.status(500).json({ message: 'Erro interno no servidor ao processar solicitação.' });
    }
};

// ==============================
// EXPORTAÇÕES
// ==============================
module.exports = {
    login,
    refreshToken,
    limparTokensExpirados,
    requestAccess
};