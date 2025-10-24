// middlewares/verificarPerfil.js
const { registrarAuditoria } = require('../controllers/auditoriaController'); // ADICIONADO (verifique este caminho)

module.exports = (perfisPermitidos = []) => {
    return async (req, res, next) => { // MODIFICADO para async
        try {
            // MUDANÇA AQUI: de req.usuario para req.user
            if (!req.user) { 
                console.error('🚨 Erro de autenticação: Nenhum usuário autenticado encontrado em req.user.');
                // ADIÇÃO DE AUDITORIA (Opcional, pois authMiddleware já pode ter pego)
                // É um erro de sistema, não de usuário, se req.user não está aqui após autenticação
                try {
                    await registrarAuditoria(
                        req.user?.id || null, // Tenta usar o ID se existir, senão null
                        'ERRO_VERIFICAR_PERFIL_USUARIO_AUSENTE', 
                        req.user?.setor_id || null, // Tenta usar setor_id, senão null
                        { rota: req.originalUrl, ip: req.ip, motivo: 'req.user undefined antes da verificação de perfil' }
                    );
                } catch (auditError) {
                    console.error('Falha ao auditar ERRO_VERIFICAR_PERFIL_USUARIO_AUSENTE:', auditError);
                }
                return res.status(401).json({ // 401 Unauthorized é o correto para "Autenticação necessária"
                    success: false,
                    message: 'Autenticação necessária. Informações do usuário ausentes.'
                });
            }

            // MUDANÇA AQUI: de req.usuario.perfil_id para req.user.perfil_id
            const perfil = req.user.perfil_id; 
            console.log(`[VERIFICAR_PERFIL] 🔐 Verificação para rota ${req.originalUrl}: Usuário ID ${req.user.id}, Perfil ${perfil}. Perfis permitidos: [${perfisPermitidos.join(', ')}]`);

            if (!perfisPermitidos.includes(perfil)) {
                console.warn(`[VERIFICAR_PERFIL] ⚠️ Acesso negado: Usuário ${req.user.id} com perfil ${perfil} tentou acessar rota que requer [${perfisPermitidos.join(', ')}]`);
                // ADIÇÃO DE AUDITORIA
                try {
                    await registrarAuditoria(
                        req.user.id,
                        'TENTATIVA_ACESSO_PERFIL_NEGADO',
                        req.user.setor_id,
                        { rota: req.originalUrl, perfil_necessario: perfisPermitidos.join(', '), perfil_usuario: perfil, ip: req.ip }
                    );
                } catch (auditError) {
                    console.error('Falha ao auditar TENTATIVA_ACESSO_PERFIL_NEGADO:', auditError);
                }
                return res.status(403).json({ // 403 Forbidden é o correto para "Acesso negado por permissão"
                    success: false,
                    message: 'Acesso negado. Você não tem permissão para esta ação.',
                    details: `Seu perfil (${perfil}) não tem permissão para esta ação. Perfis permitidos: ${perfisPermitidos.join(', ')}`
                });
            }
            next(); // Se o perfil é permitido, continua para a próxima função
        } catch (error) {
            // Se houver um erro inesperado no middleware (ex: req.user.perfil_id não existe)
            console.error('Erro inesperado em verificarPerfil:', error);
            // ADIÇÃO DE AUDITORIA (para erro inesperado no middleware)
            try {
                await registrarAuditoria(
                    req.user?.id || null, 
                    'ERRO_MIDDLEWARE_VERIFICAR_PERFIL', 
                    req.user?.setor_id || null, 
                    { erro: error.message, rota: req.originalUrl }
                );
            } catch (auditError) {
                console.error('Falha ao auditar ERRO_MIDDLEWARE_VERIFICAR_PERFIL:', auditError);
            }
            res.status(500).json({ success: false, message: 'Erro interno do servidor na verificação de perfil.' });
        }
    };
};