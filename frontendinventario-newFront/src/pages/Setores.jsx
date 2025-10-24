import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchSetores, createSetor, deleteSetor } from '../services/setoresService';
import logo from '../assets/logo.png';
import BackButton from '../components/BackButton';
import './setores.css';

export default function Setores() {
  const { usuario, logout } = useAuth();
  const [setores, setSetores] = useState([]);
  const [formData, setFormData] = useState({ nome: '', sigla: '' });
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [loading, setLoading] = useState(true);

  const carregarSetores = useCallback(async () => {
    try {
      const res = await fetchSetores();
      setSetores(res.data);
    } catch (err) {
      setErro(err.response?.data?.message || 'Falha ao carregar a lista de setores.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarSetores();
  }, [carregarSetores]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const finalValue = name === 'sigla' ? value.toUpperCase() : value;
    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setSucesso('');
    try {
      await createSetor(formData);
      setSucesso(`Setor "${formData.nome}" criado com sucesso!`);
      setFormData({ nome: '', sigla: '' });
      setTimeout(() => {
        carregarSetores();
        setSucesso('');
      }, 1500);
    } catch (error) {
      console.error("Erro ao criar setor:", error);
      setErro(error.response?.data?.message || 'Erro ao criar o setor.');
    }
  };

  const handleDelete = async (id, setorNome) => {
    if (!window.confirm(`Tem certeza que deseja excluir o setor "${setorNome}"?`)) return;
    setErro('');
    setSucesso('');
    try {
      await deleteSetor(id);
      setSucesso(`Setor "${setorNome}" excluído com sucesso.`);
      setTimeout(() => {
        carregarSetores();
        setSucesso('');
      }, 1500);
    } catch (error) {
      console.error("Erro ao excluir setor:", error);
      setErro(error.response?.data?.message || 'Erro ao excluir o setor.');
    }
  };

  const handleLogout = () => {
    if (window.confirm('Tem certeza que deseja sair?')) {
      logout();
    }
  };

  const isMasterAdmin = usuario?.perfil_id === 1;

  return (
    <div className="setores-page">
      {/* Header */}
      <header className="setores-page-header">
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
      <main className="setores-content">
        <BackButton />
        
        <header className="page-header">
          <h1>Gerenciamento de Setores</h1>
        </header>

        {sucesso && <p className="message success">{sucesso}</p>}
        {erro && <p className="message error">{erro}</p>}

        <div className="content-layout">
          {isMasterAdmin && (
            <div className="form-panel">
              <h3 className="panel-title">Criar Novo Setor</h3>
              
              <form id="form-setores" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="nome">Nome do Setor</label>
                  <input
                    id="nome"
                    name="nome"
                    type="text"
                    value={formData.nome}
                    onChange={handleChange}
                    placeholder="Ex: Assessoria de Comunicação"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="sigla">Sigla</label>
                  <input
                    id="sigla"
                    name="sigla"
                    type="text"
                    value={formData.sigla}
                    onChange={handleChange}
                    placeholder="Ex: ASCOM"
                    required
                  />
                </div>
              </form>

              <div className="form-buttons">
                <button 
                  type="submit" 
                  form="form-setores"
                  className="btn-primary"
                  disabled={loading}
                >
                  Adicionar Setor
                </button>
              </div>
            </div>
          )}

          <div className="list-panel">
            <h3 className="panel-title">Setores Existentes</h3>
            {loading ? (
              <p className="loading-message">Carregando...</p>
            ) : (
              <ul className="item-list">
                {setores.length > 0 ? (
                  setores.map(setor => (
                    <li key={setor.id} className="item">
                      <div className="item-info">
                        <span className="item-title">{setor.nome}</span>
                        <span className="item-subtitle">{setor.sigla}</span>
                      </div>
                      {isMasterAdmin && (
                        <button
                          className="btn-delete"
                          onClick={() => handleDelete(setor.id, setor.nome)}
                          title="Excluir setor"
                        >
                          Excluir
                        </button>
                      )}
                    </li>
                  ))
                ) : (
                  <p className="empty-message">Nenhum setor cadastrado.</p>
                )}
              </ul>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="setores-page-footer">
        <img 
          src={logo}
          alt="Logo Footer" 
          className="footer-logo"
        />
      </footer>
    </div>
  );
}