import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode'; // import named export corretamente

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
    console.log("AuthContext: A fazer logout e a limpar a sessão.");
    localStorage.removeItem('accessToken');
    setToken(null);
    setUsuario(null);
    navigate('/login');
  }, [navigate]);

  useEffect(() => {
    if (typeof token === 'string' && token.length > 0) {
      try {
        const decodedUser = jwtDecode(token); // Decodifica o token para obter os dados do usuário
        console.log('Token decodificado:', decodedUser);
        const currentTime = Date.now() / 1000;

        if (decodedUser.exp < currentTime) {
          logout();
        } else {
          setUsuario(decodedUser); // Define o usuário a partir do token decodificado
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