// src/components/PrivateRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';  // <-- aqui

export default function PrivateRoute({ children, allowedProfiles }) {
  const { token, usuario, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        minHeight: '100vh', fontSize: '1.2rem', color: '#555'
      }}>
        Verificando autenticação...
      </div>
    );
  }

  if (!token || !usuario) {
    console.log("Usuário não autenticado ou token ausente. Redirecionando para login.");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedProfiles && !allowedProfiles.includes(usuario.perfil_id)) {
    const message = `Acesso negado. Você não possui permissão para acessar esta página.`;
    console.warn(`Acesso negado para perfil ${usuario.perfil_id} à rota ${location.pathname}. Perfis permitidos: ${allowedProfiles.join(', ')}`);
    alert(message);
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
