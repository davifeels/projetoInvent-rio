import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchSetores, createSetor, deleteSetor } from '../services/setoresService';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import BackButton from '../components/BackButton';
import './setores.css';

export default function Setores() {
  const { usuario } = useAuth();
  const [setores, setSetores] = useState([]);
  const [formData, setFormData] = useState({ nome: '', sigla: '' });
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const navigate = useNavigate();

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
      carregarSetores();
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
      carregarSetores();
    } catch (error) {
      console.error("Erro ao excluir setor:", error);
      setErro(error.response?.data?.message || 'Erro ao excluir o setor.');
    }
  };

  const handleExportExcel = () => {
    setExporting(true);
    const ws = XLSX.utils.json_to_sheet(setores);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Setores");
    XLSX.writeFile(wb, "setores.xlsx");
    setExporting(false);
  };

  const isMasterAdmin = usuario?.perfil_id === 1;

  return (
    <div className="page-container">
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
            <form onSubmit={handleSubmit}>
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
              <div className="form-buttons">
                <button type="submit" className="btn-primary">
                  Adicionar Setor
                </button>
                <button
                  onClick={handleExportExcel}
                  className="btn-export"
                  disabled={exporting || loading}
                >
                  {exporting ? 'Exportando...' : 'Exportar para Excel'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="list-panel">
          <h3 className="panel-title">Setores Existentes</h3>
          {loading ? (
            <p>Carregando...</p>
          ) : (
            <ul className="item-list">
              {setores.map(setor => (
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
              ))}
            </ul>
          )}
          {!loading && setores.length === 0 && <p>Nenhum setor cadastrado.</p>}
        </div>
      </div>
    </div>
  );
}