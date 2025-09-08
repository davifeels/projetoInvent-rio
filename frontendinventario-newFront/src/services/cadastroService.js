import api from '../api/axios';

/**
 * Cria uma nova solicitação de cadastro.
 * @param {Object} data - Os dados do colaborador a ser cadastrado.
 * @returns {Promise<Object>} A resposta da API.
 */
export const createCadastro = (data) => {
  return api.post('/cadastros', data);
};

/**
 * Busca a lista de cadastros com status pendente.
 * @returns {Promise<Object>} A resposta da API.
 */
export const fetchPendentes = () => {
  return api.get('/cadastros/pendentes');
};

/**
 * Aprova uma solicitação de cadastro pendente.
 * @param {number|string} id - O ID do cadastro a ser aprovado.
 * @returns {Promise<Object>} A resposta da API.
 */
export const aprovarCadastro = (id) => {
  return api.patch(`/cadastros/aprovar/${id}`);
};

/**
 * Rejeita uma solicitação de cadastro pendente.
 * @param {number|string} id - O ID do cadastro a ser rejeitado.
 * @returns {Promise<Object>} A resposta da API.
 */
export const rejeitarCadastro = (id) => {
  return api.patch(`/cadastros/rejeitar/${id}`);
};
