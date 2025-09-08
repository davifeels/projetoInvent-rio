import api from '../api/axios'; // CORREÇÃO: O caminho foi ajustado de './' para '../'

export async function fetchFuncoes() {
  return api.get('/funcoes');
}

export async function createFuncao(data) {
  return api.post('/funcoes', data);
}

export async function deleteFuncao(id) {
  return api.delete(`/funcoes/${id}`);
}

// ▼▼▼ ADICIONE ESTA FUNÇÃO AO SEU ARQUIVO ▼▼▼
export const exportFuncoesExcel = () => {
  // Certifique-se de que a rota no backend é '/funcoes/exportar/excel'
  return api.get('/funcoes/exportar/excel', {
    responseType: 'blob', // Essencial para o download funcionar
  });
};
