import { jwtDecode } from 'jwt-decode';

export function getUsuarioLogado() {
  const token = localStorage.getItem('accessToken');
  if (!token) return null;

  try {
    return jwtDecode(token); // usa jwtDecode (com D maiúsculo) como função
  } catch {
    return null;
  }
}
