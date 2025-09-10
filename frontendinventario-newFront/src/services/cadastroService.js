import api from '../api/axios';

/**
 * Cria uma nova solicitação de cadastro.
 * @param {Object} data - Dados do colaborador a ser cadastrado.
 */
export const createCadastro = (data) => {
  return api.post('/cadastros', data);
};

/**
 * Busca cadastros com status pendente.
 */
export const fetchPendentes = () => {
  return api.get('/cadastros/pendentes');
};

/**
 * Aprova uma solicitação de cadastro pendente.
 * @param {number|string} id - ID do cadastro
 */
export const aprovarCadastro = (id) => {
  return api.patch(`/cadastros/aprovar/${id}`);
};

/**
 * Rejeita uma solicitação de cadastro pendente.
 * @param {number|string} id - ID do cadastro
 */
export const rejeitarCadastro = (id) => {
  return api.patch(`/cadastros/rejeitar/${id}`);
};
