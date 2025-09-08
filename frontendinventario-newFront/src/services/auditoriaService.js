import api from '../api/axios';

export async function fetchAuditoria() {
  return api.get('/auditoria');
}

// ... outras funções que você possa ter

// ▼▼▼ ADICIONE ESTA NOVA FUNÇÃO ▼▼▼
export const exportAuditoriaExcel = (params) => {
  // A função recebe um objeto com os parâmetros de data
  return api.get('/auditoria/exportar/excel', {
    params, // Ex: { data_inicio: '2025-01-01', data_fim: '2025-01-31' }
    responseType: 'blob', // Essencial para o download funcionar
  });
};
