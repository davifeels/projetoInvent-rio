import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  fetchTodosUsuarios, // novo endpoint que retorna ativos + pendentes + rejeitados
  deleteUsuario,
  aprovarUsuario,
  rejeitarUsuario,
  exportUsuariosExcel
} from '../services/usuariosService';
import './usuarios.css';

export default function Usuarios() {
  const navigate = useNavigate();
  const { usuario: usuarioLogado } = useAuth();

  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  // Carrega todos os usuários (ativos + pendentes + rejeitados)
  const carregarUsuarios = useCallback(async () => {
    try {
      setLoading(true);
      setErro('');
      const res = await fetchTodosUsuarios();
      setUsuarios(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
      setErro(err.response?.data?.message || 'Não foi possível carregar os usuários.');
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarUsuarios();
  }, [carregarUsuarios]);

  const handleEdit = (usuarioId) => navigate(`/usuarios/editar/${usuarioId}`);

  const handleDelete = async (usuarioId) => {
    if (!window.confirm('Tem certeza que deseja excluir este usuário?')) return;
    try {
      const response = await deleteUsuario(usuarioId);
      setSucesso(response.data?.message || 'Usuário excluído com sucesso.');
      setErro('');
      await carregarUsuarios();
    } catch (err) {
      setErro(err.response?.data?.message || 'Falha ao excluir o usuário.');
      setSucesso('');
    }
  };

  const handleAprovar = async (usuarioId) => {
    try {
      const response = await aprovarUsuario(usuarioId);
      setSucesso(response.data?.message || 'Usuário aprovado com sucesso.');
      setErro('');
      await carregarUsuarios();
    } catch (err) {
      setErro(err.response?.data?.message || 'Falha ao aprovar o usuário.');
      setSucesso('');
    }
  };

  const handleRejeitar = async (usuarioId) => {
    if (!window.confirm('Tem certeza que deseja rejeitar esta solicitação?')) return;
    try {
      const response = await rejeitarUsuario(usuarioId);
      setSucesso(response.data?.message || 'Usuário rejeitado com sucesso.');
      setErro('');
      await carregarUsuarios();
    } catch (err) {
      setErro(err.response?.data?.message || 'Falha ao rejeitar o usuário.');
      setSucesso('');
    }
  };

  const handleExport = async () => {
    setExporting(true);
    setErro('');
    try {
      const response = await exportUsuariosExcel();
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dataFormatada = new Date().toISOString().split('T')[0];
      link.href = url;
      link.setAttribute('download', `Relatorio_Usuarios_${dataFormatada}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      setErro('Falha ao gerar o relatório em Excel.');
    } finally {
      setExporting(false);
    }
  };

  const getNomePerfil = (perfilId) => {
    switch (perfilId) {
      case 1: return 'Master';
      case 2: return 'Coordenador';
      case 3: return 'Usuário';
      default: return 'Desconhecido';
    }
  };

  return (
    <div className="usuarios-container">
      <div className="usuarios-header">
        <h2>Gerenciamento de Usuários</h2>
        <div className="header-buttons">
          {(usuarioLogado?.perfil_id === 1 || usuarioLogado?.perfil_id === 2) && (
            <>
              <button className="btn-create" onClick={() => navigate('/usuarios/novo')}>
                Cadastrar Novo Usuário
              </button>
              <button className="btn-export" onClick={handleExport} disabled={exporting || loading}>
                {exporting ? 'Exportando...' : 'Exportar para Excel'}
              </button>
            </>
          )}
        </div>
      </div>

      {sucesso && <p className="message success">{sucesso}</p>}
      {erro && <p className="message error">{erro}</p>}

      {loading ? (
        <p>Carregando usuários...</p>
      ) : (
        <div className="table-responsive">
          <table className="usuarios-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome</th>
                <th>Email</th>
                <th>Perfil</th>
                <th>Setor</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.length > 0 ? (
                usuarios.map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.nome}</td>
                    <td>{user.email}</td>
                    <td>{getNomePerfil(user.perfil_id || user.perfil_id_solicitado)}</td>
                    <td>{user.sigla_setor || 'N/A'}</td>
                    <td>
                      <span className={`status status-${user.status?.toLowerCase().replace(/ /g, '-').replace(/[()]/g, '')}`}>
                        {user.status || 'N/A'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        {user.status === 'pendente' ? (
                          <>
                            <button className="btn-approve" onClick={() => handleAprovar(user.id)}>Aprovar</button>
                            <button className="btn-reject" onClick={() => handleRejeitar(user.id)}>Rejeitar</button>
                          </>
                        ) : (
                          <>
                            <button className="btn-edit" onClick={() => handleEdit(user.id)}>Editar</button>
                            {usuarioLogado?.perfil_id === 1 && (
                              <button className="btn-delete" onClick={() => handleDelete(user.id)}>Excluir</button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7">Nenhum usuário encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
