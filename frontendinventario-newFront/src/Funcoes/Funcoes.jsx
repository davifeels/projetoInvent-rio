// src/pages/Funcoes.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { fetchFuncoes, createFuncao, deleteFuncao } from '../services/funcoesService';
import BackButton from '../components/BackButton';
import './funcoes.css';

export default function Funcoes() {
  const [funcoes, setFuncoes] = useState([]);
  const [nome, setNome] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [loading, setLoading] = useState(true);

  const carregarFuncoes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchFuncoes();
      setFuncoes(res.data);
    } catch (err) {
      console.error("Erro ao carregar funções:", err);
      setErro(err.response?.data?.message || 'Falha ao carregar a lista de funções.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarFuncoes();
  }, [carregarFuncoes]);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    setSucesso('');
    try {
      await createFuncao({ nome });
      setSucesso(`Função "${nome}" criada com sucesso!`);
      setNome('');
      setTimeout(() => {
          carregarFuncoes();
          setSucesso('');
      }, 1500);
    } catch (error) {
      console.error("Erro ao criar função:", error);
      setErro(error.response?.data?.message || 'Erro ao criar a função.');
    }
  }

  async function handleDelete(id, nomeFuncao) {
    if (!window.confirm(`Tem certeza que deseja excluir a função "${nomeFuncao}"?`)) return;
    setErro('');
    setSucesso('');
    try {
      await deleteFuncao(id);
      setSucesso(`Função "${nomeFuncao}" excluída com sucesso.`);
      setTimeout(() => {
        carregarFuncoes();
        setSucesso('');
      }, 1500);
    } catch (error) {
      console.error("Erro ao excluir função:", error);
      setErro(error.response?.data?.message || 'Erro ao excluir a função.');
    }
  }

  return (
    <div className="page-container">
      <BackButton />
      
      <div className="page-header">
        <h1>Gerenciamento de Funções</h1>
      </div>

      <div className="content-layout">
        <div className="form-panel">
          <h3 className="panel-title">Criar Nova Função</h3>
          
          <form id="form-funcoes" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="nome">Nome da Função</label>
              <input
                id="nome"
                type="text"
                placeholder="Ex: Analista de Redes"
                value={nome}
                onChange={e => setNome(e.target.value)}
                required
              />
            </div>
          </form>

          <div className="form-buttons">
            <button
              type="submit"
              form="form-funcoes"
              className="btn-primary"
              disabled={loading}
            >
              Adicionar Função
            </button>
          </div>

          {sucesso && <p className="message success">{sucesso}</p>}
          {erro && <p className="message error">{erro}</p>}
        </div>

        <div className="list-panel">
          <h3 className="panel-title">Funções Existentes</h3>
          {loading ? <p className="loading-message">Carregando...</p> : (
            <ul className="item-list">
              {funcoes.length > 0 ? (
                funcoes.map(funcao => (
                  <li key={funcao.id} className="item">
                    <div className="item-info">
                      <span className="item-title">{funcao.nome}</span>
                    </div>
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(funcao.id, funcao.nome)}
                      title="Excluir função"
                    >
                      Excluir
                    </button>
                  </li>
                ))
              ) : (
                <p className="empty-message">Nenhuma função cadastrada.</p>
              )}
            </ul>
          )}
        </div>
      </div>
    </div>
  ) 
}