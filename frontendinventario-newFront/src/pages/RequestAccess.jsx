import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { fetchSetores } from '../services/setoresService';
import { fetchFuncoes } from '../services/funcoesService';
import api from '../api/axios';
import './RequestAccess.css'; 

export default function RequestAccess() {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
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
      console.error("Erro ao carregar dados do formulário (dropdowns):", error);
      setFeedback({ erro: error.response?.data?.message || 'Erro ao carregar dados do formulário: Tente novamente mais tarde.', sucesso: '' });
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

    try {
      const res = await api.post('/auth/solicitar-acesso', formData);
      setFeedback({ sucesso: res.data.message, erro: '' });
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      console.error("Erro ao enviar solicitação de acesso:", err);
      setFeedback({ erro: err.response?.data?.message || 'Falha ao enviar solicitação. Verifique os dados e tente novamente.', sucesso: '' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="request-access-container">
      <form onSubmit={handleSubmit} autoComplete="off">
        <h2>Solicitar Acesso ao Sistema</h2>

        {feedback.erro && <div className="form-global-error">{feedback.erro}</div>}
        {feedback.sucesso && <div className="form-global-success">{feedback.sucesso}</div>}

        <div className="form-group">
          <label htmlFor="nome">Nome Completo</label>
          <input
            name="nome"
            type="text"
            id="nome"
            placeholder="Digite seu nome completo"
            value={formData.nome}
            onChange={handleChange}
            required
            disabled={loading || feedback.sucesso}
            autoComplete="off"
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Seu E-mail de Trabalho</label>
          <input
            name="email"
            type="email"
            id="email"
            placeholder="exemplo@dominio.com"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={loading || feedback.sucesso}
            autoComplete="off"
          />
        </div>

        <div className="form-group">
          <label htmlFor="senha">Crie uma Senha</label>
          <input
            name="senha"
            type="password"
            id="senha"
            placeholder="Mínimo 6 caracteres"
            value={formData.senha}
            onChange={handleChange}
            required
            disabled={loading || feedback.sucesso}
            autoComplete="new-password"
          />
        </div>

        <div className="form-group">
          <label htmlFor="setor_id">Selecione seu Setor</label>
          <select
            name="setor_id"
            id="setor_id"
            value={formData.setor_id}
            onChange={handleChange}
            required
            disabled={loading || feedback.sucesso}
          >
            <option value="">Selecione seu Setor...</option>
            {setores.map((setor) => (
              <option key={setor.id} value={setor.id}>
                {setor.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="funcao_id">Selecione sua Função</label>
          <select
            name="funcao_id"
            id="funcao_id"
            value={formData.funcao_id}
            onChange={handleChange}
            required
            disabled={loading || feedback.sucesso}
          >
            <option value="">Selecione sua Função...</option>
            {funcoes.map((funcao) => (
              <option key={funcao.id} value={funcao.id}>
                {funcao.nome}
              </option>
            ))}
          </select>
        </div>

        <button type="submit" className="btn-submit" disabled={loading || feedback.sucesso}>
          {loading ? 'Enviando...' : 'Enviar Solicitação'}
        </button>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <Link to="/login" className="link-login">Já tem uma conta? Voltar para o Login</Link>
        </div>
      </form>
    </div>
  );
}