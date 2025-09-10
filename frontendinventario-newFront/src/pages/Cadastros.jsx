// src/pages/Cadastros.jsx

import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import './Cadastros.css';
import { jwtDecode } from 'jwt-decode';

export default function Cadastros() {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    sigla_setor: '',
    funcao_id: '',
    // ✅ CORRIGIDO: O tipo de usuário e perfil agora são selecionáveis no formulário
    tipo_usuario: 'USUARIO',
    perfil_id: '3'
  });

  const [setores, setSetores] = useState([]);
  const [funcoes, setFuncoes] = useState([]);
  const [pendentes, setPendentes] = useState([]);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const fetchPendentes = useCallback(async () => {
    try {
      const res = await api.get('/cadastros/pendentes');
      setPendentes(res.data);
    } catch (error) {
      console.error('Erro ao carregar pendentes:', error);
      setErro('Erro ao carregar solicitações pendentes.');
    }
  }, []);

  const fetchSetores = useCallback(async () => {
    try {
      const res = await api.get('/setores');
      setSetores(res.data);
    } catch (error) {
      console.error('Erro ao carregar setores:', error);
      setErro('Erro ao carregar setores.');
    }
  }, []);

  const fetchFuncoes = useCallback(async () => {
    try {
      const res = await api.get('/funcoes');
      setFuncoes(res.data);
    } catch (error) {
      console.error('Erro ao carregar funções:', error);
      setErro('Erro ao carregar a lista de funções.');
    }
  }, []);

  useEffect(() => {
    fetchSetores();
    fetchPendentes();
    fetchFuncoes();
  }, [fetchSetores, fetchPendentes, fetchFuncoes]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setSucesso('');
    
    // ✅ CORRIGIDO: Validação para garantir que um perfil foi selecionado.
    if (!formData.perfil_id) {
        setErro("Por favor, selecione o perfil do colaborador.");
        return;
    }

    try {
      let response;
      if (formData.perfil_id === '2') {
        // ✅ CORRIGIDO: Rota para cadastro DIRETO de coordenador
        response = await api.post('/cadastros/coordenador-direto', formData);
        setSucesso(response.data.message);
      } else {
        // ✅ CORRIGIDO: Rota para solicitação PENDENTE de usuário comum
        response = await api.post('/cadastros', formData);
        setSucesso(response.data.message);
      }

      setFormData({ nome: '', email: '', senha: '', sigla_setor: '', funcao_id: '', tipo_usuario: 'USUARIO', perfil_id: '3' });
      fetchPendentes();
    } catch (error) {
      console.error('Erro ao cadastrar:', error);
      setErro(error.response?.data?.message || 'Erro ao enviar solicitação de cadastro.');
    }
  };
  
  const handleAprovar = async (id) => {
    if (!window.confirm("Tem certeza que deseja aprovar este cadastro?")) return;
    try {
      const response = await api.patch(`/cadastros/aprovar/${id}`);
      alert(response.data.message);
      fetchPendentes();
    } catch (error) {
      console.error('Erro ao aprovar:', error);
      alert(error.response?.data?.message || 'Erro ao aprovar cadastro');
    }
  };

  const handleRejeitar = async (id) => {
    if (!window.confirm("Tem certeza que deseja rejeitar este cadastro?")) return;
    try {
      const response = await api.patch(`/cadastros/rejeitar/${id}`);
      alert(response.data.message);
      fetchPendentes();
    } catch (error) {
      console.error('Erro ao rejeitar:', error);
      alert(error.response?.data?.message || 'Erro ao rejeitar cadastro');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  // ✅ CORRIGIDO: Renderização do formulário para permitir a escolha de perfil e setor
  return (
    <div className="cadastros-container">
      <h2>Cadastrar Colaborador</h2>
      {erro && <p className="error">{erro}</p>}
      {sucesso && <p className="success">{sucesso}</p>}

      <form className="cadastros-form" onSubmit={handleSubmit}>
        <input name="nome" placeholder="Nome" value={formData.nome} onChange={handleChange} required />
        <input name="email" type="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
        <input name="senha" type="password" placeholder="Senha" value={formData.senha} onChange={handleChange} required />
        
        <select name="perfil_id" value={formData.perfil_id} onChange={handleChange} required>
          <option value="">Selecione o perfil</option>
          <option value="2">Coordenador</option>
          <option value="3">Usuário</option>
        </select>
        
        <select name="sigla_setor" value={formData.sigla_setor} onChange={handleChange} required>
          <option value="">Selecione o setor</option>
          {setores.map((s) => (
            <option key={s.id || s.sigla} value={s.sigla}>
              {s.nome} ({s.sigla})
            </option>
          ))}
        </select>
        
        <select name="funcao_id" value={formData.funcao_id} onChange={handleChange} required>
          <option value="">Selecione a função</option>
          {funcoes.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nome}
            </option>
          ))}
        </select>

        <button type="submit">Enviar</button>
      </form>

      <h3>Solicitações Pendentes</h3>
      <table className="cadastros-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nome</th>
            <th>Email</th>
            <th>Setor</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {pendentes.length === 0 ? (
            <tr>
              <td colSpan="5">Nenhum cadastro pendente.</td>
            </tr>
          ) : (
            pendentes.map((p) => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td>{p.nome}</td>
                <td>{p.email}</td>
                <td>{p.setor_sigla}</td>
                <td>
                  <button onClick={() => handleAprovar(p.id)} className="btn-approve">Aprovar</button>
                  <button onClick={() => handleRejeitar(p.id)} className="btn-reject">Rejeitar</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}