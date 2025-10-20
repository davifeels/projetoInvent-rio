import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';
import './Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

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
      console.error('Erro no login:', err);
      setErro('Credencial ou senha inválida. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <header className="login-header">
        <div className="header-left">
          <img src={logo} alt="Logo" className="header-logo" />
          <div className="header-text">
            <h1 className="header-title">Inventário LGPD</h1>
            <p className="header-subtitle">Gestão Inteligente e Segurança de Dados</p>
          </div>
        </div>
        <button className="header-login-button">Login</button>
      </header>

      <main className="login-content">
        <div className="login-card">
          <h2 className="login-card-title">Fazer login:</h2>

          {erro && (
            <div className="login-error-message">
              {erro}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="login-form-group">
              <label htmlFor="email" className="login-form-label">
                E-mail:
              </label>
              <input
                id="email"
                type="email"
                className="login-form-input"
                placeholder="E-mail ou usuário"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="username"
              />
            </div>

            <div className="login-form-group">
              <label htmlFor="senha" className="login-form-label">
                Senha:
              </label>
              <input
                id="senha"
                type="password"
                className="login-form-input"
                placeholder="Senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <Link to="/forgot-password" className="forgot-password-link">
              Esqueceu sua senha?
            </Link>

            <button
              type="submit"
              className="login-submit-button"
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Fazer login'}
            </button>
          </form>

          <div className="signup-link-container">
            Ainda não tenho conta{' '}
            <Link to="/request-access" className="signup-link">
              Criar conta
            </Link>
          </div>
        </div>
      </main>

      <footer className="login-footer">
        <img 
          src={logo}
          alt="Logo Footer" 
          className="footer-logo"
        />
      </footer>
    </div>
  );
}