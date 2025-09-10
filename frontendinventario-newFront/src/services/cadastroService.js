import api from '../api/axios';

/**
 * Cria uma nova solicitação de cadastro.
 * @param {Object} data - Dados do colaborador a ser cadastrado.
 */
// FUNÇÃO AJUSTADA
export const createCadastro = async (data) => {
  if (!data) throw new Error('Dados do cadastro são obrigatórios.');
  try {
    // Envia os dados diretamente, sem criar um novo payload
    const response = await api.post('/cadastros', data);
    return response.data;
  } catch (error) {
    console.error('Erro createCadastro:', error);
    throw error;
  }
};

/**
 * Busca cadastros com status pendente.
 */
export const fetchPendentes = async () => {
  try {
    const response = await api.get('/cadastros/pendentes');
    return response.data;
  } catch (error) {
    console.error('Erro fetchPendentes:', error);
    throw error;
  }
};

/**
 * Aprova uma solicitação de cadastro pendente.
 * @param {number|string} id - ID do cadastro
 */
export const aprovarCadastro = async (id) => {
  if (!id) throw new Error('ID do cadastro é obrigatório.');
  try {
    const response = await api.patch(`/cadastros/aprovar/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Erro aprovarCadastro(${id}):`, error);
    throw error;
  }
};

/**
 * Rejeita uma solicitação de cadastro pendente.
 * @param {number|string} id - ID do cadastro
 */
export const rejeitarCadastro = async (id) => {
  if (!id) throw new Error('ID do cadastro é obrigatório.');
  try {
    const response = await api.patch(`/cadastros/rejeitar/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Erro rejeitarCadastro(${id}):`, error);
    throw error;
  }
};