import React, { useState, useEffect, useCallback } from 'react';
import { fetchFuncoes, createFuncao, deleteFuncao } from '../services/funcoesService';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';
import BackButton from '../components/BackButton';
import './funcoes.css';

export default function Funcoes() {
  const { usuario, logout } = useAuth();
  const [funcoes, setFuncoes] = useState([]);
  const [formData, setFormData] = useState({ nome: '' });
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [loading, setLoading] = useState(true);

  const carregarFuncoes = useCallback(async () => {
    try {
      const res = await fetchFuncoes();
      setFuncoes(res.data);
    } catch (err) {
      setErro(err.response?.data?.message || 'Falha ao carregar a lista de funções.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarFuncoes();
  }, [carregarFuncoes]);

  const handleChange = (e) => {
    setFormData({ nome: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setSucesso('');
    try {
      await createFuncao(formData);
      setSucesso(`Função "${formData.nome}" criada com sucesso!`);
      setFormData({ nome: '' });
      setTimeout(() => {
        carregarFuncoes();
        setSucesso('');
      }, 1500);
    } catch (error) {
      console.error("Erro ao criar função:", error);
      setErro(error.response?.data?.message || 'Erro ao criar a função.');
    }
  };

  const handleDelete = async (id, funcaoNome) => {
    if (!window.confirm(`Tem certeza que deseja excluir a função "${funcaoNome}"?`)) return;
    setErro('');
    setSucesso('');
    try {
      await deleteFuncao(id);
      setSucesso(`Função "${funcaoNome}" excluída com sucesso.`);
      setTimeout(() => {
        carregarFuncoes();
        setSucesso('');
      }, 1500);
    } catch (error) {
      console.error("Erro ao excluir função:", error);
      setErro(error.response?.data?.message || 'Erro ao excluir a função.');
    }
  };

  const handleLogout = () => {
    if (window.confirm('Tem certeza que deseja sair?')) {
      logout();
    }
  };

  const isMasterAdmin = usuario?.perfil_id === 1;

  return (
    <div className="funcoes-page">
      {/* Header */}
      <header className="funcoes-page-header">
        <div className="header-left">
          <img src={logo} alt="Logo" className="header-logo" />
          <div className="header-text">
            <h1 className="header-title">Inventário LGPD</h1>
            <p className="header-subtitle">Gestão Inteligente e Segurança de Dados</p>
          </div>
        </div>
        <div className="header-right">
          <p className="user-greeting">Olá, {usuario?.nome || usuario?.email || 'usuário'}!</p>
          <button onClick={handleLogout} className="logout-button">Sair</button>
        </div>
      </header>

      {/* Conteúdo com scroll */}
      <main className="funcoes-content">
        <BackButton />
        
        <header className="page-header">
          <h1>Gerenciamento de Funções</h1>
        </header>

        {sucesso && <p className="message success">{sucesso}</p>}
        {erro && <p className="message error">{erro}</p>}

        <div className="content-layout">
          {isMasterAdmin && (
            <div className="form-panel">
              <h3 className="panel-title">Criar Nova Função</h3>
              
              <form id="form-funcoes" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="nome">Nome da Função</label>
                  <input
                    id="nome"
                    name="nome"
                    type="text"
                    value={formData.nome}
                    onChange={handleChange}
                    placeholder="Ex: Desenvolvedor"
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
            </div>
          )}

          <div className="list-panel">
            <h3 className="panel-title">Funções Existentes</h3>
            {loading ? (
              <p className="loading-message">Carregando...</p>
            ) : (
              <ul className="item-list">
                {funcoes.length > 0 ? (
                  funcoes.map(funcao => (
                    <li key={funcao.id} className="item">
                      <div className="item-info">
                        <span className="item-title">{funcao.nome}</span>
                      </div>
                      {isMasterAdmin && (
                        <button
                          className="btn-delete"
                          onClick={() => handleDelete(funcao.id, funcao.nome)}
                          title="Excluir função"
                        >
                          Excluir
                        </button>
                      )}
                    </li>
                  ))
                ) : (
                  <p className="empty-message">Nenhuma função cadastrada.</p>
                )}
              </ul>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="funcoes-page-footer">
        <img 
          src={logo}
          alt="Logo Footer" 
          className="footer-logo"
        />
      </footer>
    </div>
  );
}