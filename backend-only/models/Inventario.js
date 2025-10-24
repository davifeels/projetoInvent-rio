// backend/models/Inventario.js

const pool = require('../config/db');

const InventarioModel = {
    findAll: async () => {
        const query = `
            SELECT 
                id, nome_servico, sigla_servico, resumo_atividade, diretoria, setor_responsavel,
                controlador, co_controlador, operador, canal_titular, dados_pessoais_comuns,
                dados_pessoais_sensiveis, categorias_titulares, finalidade, hipotese_tratamento,
                principios_lgpd, compartilhamento_detalhes, finalidade_compartilhamento,
                transferencia_internacional, paises_transferencia, garantias_transferencia,
                medidas_seguranca, periodo_retencao, forma_eliminacao, usuario_id, -- <--- MUDANÇA AQUI: de 'usuarioId' para 'usuario_id'
                createdAt, updatedAt
            FROM inventario_lgpd 
        `;
        const [rows] = await pool.query(query);
        
        return rows.map(row => {
            const parsedRow = { ...row };
            // Lógica para parsear campos JSON permanece a mesma
            if (typeof parsedRow.dados_pessoais_comuns === 'string') {
                try { parsedRow.dados_pessoais_comuns = JSON.parse(parsedRow.dados_pessoais_comuns); } catch (e) { parsedRow.dados_pessoais_comuns = []; }
            }
            if (typeof parsedRow.dados_pessoais_sensiveis === 'string') {
                try { parsedRow.dados_pessoais_sensiveis = JSON.parse(parsedRow.dados_pessoais_sensiveis); } catch (e) { parsedRow.dados_pessoais_sensiveis = []; }
            }
            if (typeof parsedRow.categorias_titulares === 'string') {
                try { parsedRow.categorias_titulares = JSON.parse(parsedRow.categorias_titulares); } catch (e) { parsedRow.categorias_titulares = []; }
            }
            if (typeof parsedRow.principios_lgpd === 'string') {
                try { parsedRow.principios_lgpd = JSON.parse(parsedRow.principios_lgpd); } catch (e) { parsedRow.principios_lgpd = []; }
            }
            if (typeof parsedRow.compartilhamento_detalhes === 'string') {
                try { parsedRow.compartilhamento_detalhes = JSON.parse(parsedRow.compartilhamento_detalhes); } catch (e) { parsedRow.compartilhamento_detalhes = []; }
            }
            if (typeof parsedRow.medidas_seguranca === 'string') {
                try { parsedRow.medidas_seguranca = JSON.parse(parsedRow.medidas_seguranca); } catch (e) { parsedRow.medidas_seguranca = []; }
            }
            return parsedRow;
        });
    },
};

module.exports = InventarioModel;