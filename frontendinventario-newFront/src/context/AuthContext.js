import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('accessToken'));
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const logout = useCallback(() => {
    console.log("AuthContext: Fazendo logout e limpando a sessão.");
    localStorage.removeItem('accessToken');
    setToken(null);
    setUsuario(null);
    
    // 🔥 NAVEGA PARA /login (router adiciona o basename automaticamente)
    navigate('/login');
  }, [navigate]);

  useEffect(() => {
    if (typeof token === 'string' && token.length > 0) {
      try {
        const decodedUser = jwtDecode(token);
        console.log('Token decodificado:', decodedUser);
        const currentTime = Date.now() / 1000;

        if (decodedUser.exp < currentTime) {
          console.warn('⚠️ Token expirado!');
          logout();
        } else {
          setUsuario(decodedUser);
        }
      } catch (e) {
        console.error('AuthContext: Token inválido ou corrompido.', e);
        logout();
      }
    } else {
      setUsuario(null);
    }
    setLoading(false);
  }, [token, logout]);

  const login = (newToken) => {
    if (typeof newToken === 'string' && newToken.length > 0) {
      localStorage.setItem('accessToken', newToken);
      setToken(newToken);

      // 🔥 NAVEGA PARA o destino (router adiciona o basename automaticamente)
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } else {
      console.error('Token inválido recebido no login:', newToken);
    }
  };

  const value = { usuario, token, loading, login, logout };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};