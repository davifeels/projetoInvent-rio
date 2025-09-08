import React, { useState } from 'react';
import { Link } from 'react-router-dom'; // Importa o Link para navegação
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import './Login.css'; // Estilos locais para este componente

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  async function handleLogin(e) {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, senha });
      const { accessToken } = res.data;

      if (accessToken) {
        login(accessToken);
      } else {
        setErro('Resposta de login inválida do servidor.');
      }
    } catch (err) {
      setErro(err.response?.data?.message || 'Falha no login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleLogin}>
        <h2>Entrar</h2>

        {erro && (
          <div className="error-message" style={{ color: 'red', marginBottom: '10px' }}>
            {erro}
          </div>
        )}

        <div>
          <label htmlFor="email">Email:</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="username"
          />
        </div>

        <div>
          <label htmlFor="senha">Senha:</label>
          <input
            id="senha"
            type="password"
            value={senha}
            onChange={e => setSenha(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <span>
            Não tem uma conta? <Link to="/request-access">Solicite seu acesso aqui</Link>
          </span>
        </div>
      </form>
    </div>
  );
}
