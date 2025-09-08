import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios'; // ✅ Caminho ajustado para sair de src/pages e acessar src/api
import './Cadastros.css'; // ✅ Caminho correto se o CSS está na mesma pasta do componente
import { jwtDecode } from 'jwt-decode';


export default function Cadastros() {
  const [colaborador, setColaborador] = useState({
    nome: '',
    email: '',
    senha: '',
    sigla_setor: '',
    funcao_id: '',
    tipo_usuario: 'COORDENADOR',
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
    if (!colaborador.funcao_id) {
        setErro("Por favor, selecione a função do colaborador.");
        return;
    }

    try {
      const response = await api.post('/cadastros', colaborador);
      setSucesso(response.data.message);
      setColaborador({ nome: '', email: '', senha: '', sigla_setor: '', funcao_id: '', tipo_usuario: 'COORDENADOR' });
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
    setColaborador({ ...colaborador, [e.target.name]: e.target.value });
  };

  return (
    <div className="cadastros-container">
      <h2>Cadastrar Coordenador</h2>
      {erro && <p className="error">{erro}</p>}
      {sucesso && <p className="success">{sucesso}</p>}

      <form className="cadastros-form" onSubmit={handleSubmit}>
        <input name="nome" placeholder="Nome" value={colaborador.nome} onChange={handleChange} required />
        <input name="email" type="email" placeholder="Email" value={colaborador.email} onChange={handleChange} required />
        <input name="senha" type="password" placeholder="Senha" value={colaborador.senha} onChange={handleChange} required />
        <select name="sigla_setor" value={colaborador.sigla_setor} onChange={handleChange} required>
          <option value="">Selecione o setor</option>
          {setores.map((s) => (
            <option key={s.id || s.sigla} value={s.sigla}>
              {s.nome} ({s.sigla})
            </option>
          ))}
        </select>
        
        <select name="funcao_id" value={colaborador.funcao_id} onChange={handleChange} required>
            <option value="">Selecione a função</option>
            {funcoes.map((f) => (
                <option key={f.id} value={f.id}>
                    {f.nome}
                </option>
            ))}
        </select>

        <button type="submit">Enviar Solicitação</button>
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
