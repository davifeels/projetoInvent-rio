import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  fetchUsuarios, 
  deleteUsuario, 
  exportUsuariosExcel, 
  aprovarUsuario, 
  rejeitarUsuario 
} from '../services/usuariosService';
import { useAuth } from '../context/AuthContext';
import BackButton from '../components/BackButton';
import './usuarios.css';

export default function Usuarios() {
  const navigate = useNavigate();
  const { usuario: usuarioLogado } = useAuth();

  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const carregarUsuarios = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchUsuarios();
      let listaUsuarios = res.data;

      // ✅ FILTRO ADICIONADO: Coordenador não vê Master
      if (usuarioLogado?.perfil_id === 2) {
        listaUsuarios = listaUsuarios.filter(u => u.perfil_id !== 1);
      }

      setUsuarios(listaUsuarios);
    } catch (err) {
      console.error("Erro ao buscar usuários:", err);
      setErro(err.response?.data?.message || 'Não foi possível carregar os usuários.');
    } finally {
      setLoading(false);
    }
  }, [usuarioLogado]);

  useEffect(() => {
    carregarUsuarios();
  }, [carregarUsuarios]);

  const handleEdit = (usuarioId) => navigate(`/usuarios/editar/${usuarioId}`);

  const handleDelete = async (usuarioId) => {
    if (!window.confirm('Tem certeza que deseja excluir este usuário?')) return;
    try {
      const response = await deleteUsuario(usuarioId);
      setSucesso(response.data.message);
      setErro('');
      carregarUsuarios();
    } catch (err) {
      console.error("Erro ao excluir usuário:", err);
      setErro(err.response?.data?.message || 'Falha ao excluir o usuário.');
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
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao exportar para Excel:', error);
      setErro('Falha ao gerar o relatório em Excel.');
    } finally {
      setExporting(false);
    }
  };

  const handleAprovar = async (usuarioId) => {
    if (!window.confirm('Deseja aprovar este usuário?')) return;
    try {
      await aprovarUsuario(usuarioId);
      setSucesso('Usuário aprovado com sucesso!');
      setErro('');
      carregarUsuarios();
    } catch (err) {
      console.error(err);
      setErro('Falha ao aprovar usuário.');
      setSucesso('');
    }
  };

  const handleRecusar = async (usuarioId) => {
    if (!window.confirm('Deseja recusar este usuário?')) return;
    try {
      await rejeitarUsuario(usuarioId);
      setSucesso('Usuário recusado com sucesso!');
      setErro('');
      carregarUsuarios();
    } catch (err) {
      console.error(err);
      setErro('Falha ao recusar usuário.');
      setSucesso('');
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

  // ✅ FUNÇÃO AUXILIAR: Verifica se deve mostrar ações
  const podeInteragirComUsuario = (user) => {
    // Coordenador não pode interagir com Master (mas o backend já bloqueia também)
    if (usuarioLogado?.perfil_id === 2 && user.perfil_id === 1) {
      return false;
    }
    return true;
  };

  return (
    <div className="usuarios-container">
      <BackButton />
      
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
                    <td>{getNomePerfil(user.perfil_id)}</td>
                    <td>{user.sigla_setor || 'N/A'}</td>
                    <td>
                      <span className={`status status-${user.status?.toLowerCase()}`}>
                        {user.status}
                      </span>
                    </td>
                    <td>
                      {/* ✅ PROTEÇÃO ADICIONAL: Não mostrar ações se não pode interagir */}
                      {podeInteragirComUsuario(user) ? (
                        <div className="action-buttons">
                          {user.status === 'pendente' ? (
                            <>
                              <button className="btn-approve" onClick={() => handleAprovar(user.id)}>Aprovar</button>
                              <button className="btn-reject" onClick={() => handleRecusar(user.id)}>Recusar</button>
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
                      ) : (
                        <span className="no-actions">-</span>
                      )}
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
