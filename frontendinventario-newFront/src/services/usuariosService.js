import api from '../api/axios';

export async function fetchUsuarios() {
  return api.get('/usuarios');
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
  return api.get('/usuarios/pendentes');
}

export const exportUsuariosExcel = () => {
  return api.get('/usuarios/exportar/excel', {
    responseType: 'blob', 
  });
};
