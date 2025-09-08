// Importa a instância configurada do Axios, que já inclui o token de autenticação.
import api from '../api/axios';

/**
 * Busca a lista de todos os setores.
 * @returns {Promise} A promessa da chamada da API.
 */
export const fetchSetores = () => {
  return api.get('/setores');
};

/**
 * Cria um novo setor.
 * @param {object} setorData - Os dados do setor a ser criado (ex: { nome, sigla }).
 * @returns {Promise} A promessa da chamada da API.
 */
export const createSetor = (setorData) => {
  return api.post('/setores', setorData);
};

/**
 * Exclui um setor pelo seu ID.
 * @param {number} id - O ID do setor a ser excluído.
 * @returns {Promise} A promessa da chamada da API.
 */
export const deleteSetor = (id) => {
  return api.delete(`/setores/${id}`);
};

/**
 * Busca todos os usuários pertencentes a um setor específico.
 * @param {number} id - O ID do setor.
 * @returns {Promise} A promessa da chamada da API.
 */
export const fetchUsuariosPorSetor = (id) => {
    return api.get(`/setores/${id}/usuarios`);
}

/**
 * Solicita a exportação dos dados dos setores em formato Excel.
 * @returns {Promise} A promessa da chamada da API.
 */
export const exportSetoresExcel = () => {
  // A rota no backend deve corresponder a esta.
  return api.get('/setores/exportar/excel', {
    responseType: 'blob', // Essencial para o navegador entender que é um arquivo para download.
  });
};
