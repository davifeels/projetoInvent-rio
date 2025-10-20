import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { fetchSetores } from '../services/setoresService';
import { fetchFuncoes } from '../services/funcoesService';
import api from '../api/axios';
import logo from '../assets/logo.png';
import './RequestAccess.css';

export default function RequestAccess() {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    senhaConfirm: '',
    setor_id: '',
    funcao_id: ''
  });
  
  const [setores, setSetores] = useState([]);
  const [funcoes, setFuncoes] = useState([]);
  const [feedback, setFeedback] = useState({ erro: '', sucesso: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const loadDropdownData = useCallback(async () => {
    setFeedback({ erro: '', sucesso: '' });
    try {
      const resSetores = await fetchSetores();
      setSetores(resSetores.data);
      const resFuncoes = await fetchFuncoes();
      setFuncoes(resFuncoes.data);
    } catch (error) {
      console.error("Erro ao carregar dados do formulário:", error);
      setFeedback({ 
        erro: error.response?.data?.message || 'Erro ao carregar dados do formulário. Tente novamente mais tarde.', 
        sucesso: '' 
      });
    }
  }, []);

  useEffect(() => {
    loadDropdownData();
  }, [loadDropdownData]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFeedback({ erro: '', sucesso: '' });

    if (formData.senha !== formData.senhaConfirm) {
      setFeedback({ erro: 'As senhas não coincidem.', sucesso: '' });
      setLoading(false);
      return;
    }

    try {
      const res = await api.post('/auth/solicitar-acesso', {
        nome: formData.nome,
        email: formData.email,
        senha: formData.senha,
        setor_id: formData.setor_id,
        funcao_id: formData.funcao_id
      });
      setFeedback({ sucesso: res.data.message, erro: '' });
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      console.error("Erro ao enviar solicitação de acesso:", err);
      setFeedback({ 
        erro: err.response?.data?.message || 'Falha ao enviar solicitação. Verifique os dados e tente novamente.', 
        sucesso: '' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="request-access-page">
      <header className="request-access-header">
        <div className="header-left">
          <img src={logo} alt="Logo" className="header-logo" />
          <div className="header-text">
            <h1 className="request-header-title">Inventário LGPD</h1>
            <p className="request-header-subtitle">Gestão Inteligente e Segurança de Dados</p>
          </div>
        </div>
        <Link to="/login" className="header-login-button">Login</Link>
      </header>

      <main className="request-access-content">
        <div className="request-access-card">
          <h2 className="request-access-card-title">Solicite acesso ao sistema</h2>

          {feedback.erro && (
            <div className="request-error-message">
              {feedback.erro}
            </div>
          )}

          {feedback.sucesso && (
            <div className="request-success-message">
              {feedback.sucesso}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="request-form-group">
              <label htmlFor="nome" className="request-form-label">
                Nome Completo
              </label>
              <input
                id="nome"
                type="text"
                name="nome"
                className="request-form-input"
                value={formData.nome}
                onChange={handleChange}
                required
                disabled={loading || feedback.sucesso}
                autoComplete="off"
              />
            </div>

            <div className="request-form-group">
              <label htmlFor="setor_id" className="request-form-label">
                Setor
              </label>
              <select
                id="setor_id"
                name="setor_id"
                className="request-form-select"
                value={formData.setor_id}
                onChange={handleChange}
                required
                disabled={loading || feedback.sucesso}
              >
                <option value="">Selecione seu setor</option>
                {setores.map((setor) => (
                  <option key={setor.id} value={setor.id}>
                    {setor.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="request-form-group">
              <label htmlFor="funcao_id" className="request-form-label">
                Função
              </label>
              <select
                id="funcao_id"
                name="funcao_id"
                className="request-form-select"
                value={formData.funcao_id}
                onChange={handleChange}
                required
                disabled={loading || feedback.sucesso}
              >
                <option value="">Selecione sua função</option>
                {funcoes.map((funcao) => (
                  <option key={funcao.id} value={funcao.id}>
                    {funcao.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="request-form-group">
              <label htmlFor="email" className="request-form-label">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                name="email"
                className="request-form-input"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading || feedback.sucesso}
                autoComplete="off"
              />
            </div>

            <div className="request-form-row-passwords">
              <div className="request-form-group request-form-group-password">
                <label htmlFor="senha" className="request-form-label">
                  Crie sua senha
                </label>
                <input
                  id="senha"
                  type="password"
                  name="senha"
                  className="request-form-input"
                  placeholder="Insira uma senha"
                  value={formData.senha}
                  onChange={handleChange}
                  required
                  minLength="6"
                  disabled={loading || feedback.sucesso}
                  autoComplete="new-password"
                />
              </div>

              <div className="request-form-group request-form-group-password">
                <label htmlFor="senhaConfirm" className="request-form-label">
                  Repita sua senha
                </label>
                <input
                  id="senhaConfirm"
                  type="password"
                  name="senhaConfirm"
                  className="request-form-input"
                  placeholder="Insira uma senha"
                  value={formData.senhaConfirm}
                  onChange={handleChange}
                  required
                  minLength="6"
                  disabled={loading || feedback.sucesso}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <button
              type="submit"
              className="request-submit-button"
              disabled={loading || feedback.sucesso}
            >
              {loading ? 'Enviando...' : 'Enviar solicitação'}
            </button>
          </form>

          <div className="login-link-container">
            Já tenho conta{' '}
            <Link to="/login" className="login-link">
              Fazer login
            </Link>
          </div>
        </div>
      </main>

      <footer className="request-access-footer">
        <img 
          src={logo}
          alt="Logo Footer" 
          className="request-footer-logo"
        />
      </footer>
    </div>
  );
}