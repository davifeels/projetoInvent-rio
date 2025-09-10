import api from '../api/axios';

/**
 * Retorna todos os usuários (MASTER, COORDENADOR, USUÁRIO)
 */
export async function fetchUsuarios() {
  return api.get('/usuarios'); // backend deve retornar todos
}

export async function fetchUsuarioPorId(id) {
  return api.get(`/usuarios/${id}`);
}

export async function createUsuario(data) {
  return api.post('/usuarios', data);
}

export async function updateUsuario(id, data) {
  return api.put(`/usuarios/${id}`, data);
}

export async function deleteUsuario(id) {
  return api.delete(`/usuarios/${id}`);
}

export async function resetPassword(id, novaSenha) {
  return api.patch(`/usuarios/${id}/reset-password`, { senha: novaSenha });
}

export async function aprovarUsuario(id) {
  return api.patch(`/usuarios/aprovar/${id}`);
}

export async function rejeitarUsuario(id) {
  return api.patch(`/usuarios/rejeitar/${id}`);
}

export async function fetchUsuariosPendentes() {
  return api.get('/usuarios/pendentes'); // usado apenas para tela de aprovação
}

export const exportUsuariosExcel = () => {
  return api.get('/usuarios/exportar/excel', { responseType: 'blob' });
};
