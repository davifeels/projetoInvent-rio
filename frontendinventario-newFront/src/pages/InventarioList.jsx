import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import api from '../api/axios';
import BackButton from '../components/BackButton';
import './usuariosList.css';

export default function InventarioList() {
  const [itens, setItens] = useState([]);
  const [erro, setErro] = useState('');
  const [perfilId, setPerfilId] = useState(null);
  const [setorNome, setSetorNome] = useState('');
  const [exporting, setExporting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setErro('Você precisa fazer login.');
      return;
    }

    try {
      const usuario = jwtDecode(token);
      setPerfilId(usuario.perfil_id);
    } catch {
      setErro('Token inválido.');
      return;
    }

    api.get('/inventario')
      .then(res => {
        setItens(res.data);
        if (res.data.length > 0 && res.data[0].nome_setor) {
          setSetorNome(`: ${res.data[0].nome_setor}`);
        } else {
          setSetorNome("");
        }
      })
      .catch(err => {
        console.error('Erro ao buscar inventário:', err);
        setErro(err.response?.data?.message || 'Falha ao buscar dados');
      });
  }, []);

  const handleExport = async () => {
    setExporting(true);
    setErro('');
    try {
      const response = await api.get('/inventario/exportar/excel', {
        responseType: 'blob',
      });
      
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const dataFormatada = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `Inventario_${dataFormatada}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao exportar inventário:', error);
      const serverMessage = error.response?.data?.message || 'Falha ao gerar o relatório.';
      setErro(serverMessage);
    } finally {
      setExporting(false);
    }
  };

  if (erro) {
    return <div className="error-message">{erro}</div>;
  }

  return (
    <div className="usuarios-container">
      <BackButton />
      
      <div className="usuarios-header">
        <h2>Inventário de Dados {setorNome}</h2>
        <div className="header-buttons">
          {(perfilId === 1 || perfilId === 2) && (
            <>
              <button
                onClick={handleExport}
                className="btn-export"
                disabled={exporting}
              >
                {exporting ? 'Exportando...' : 'Exportar para Excel'}
              </button>
              <button
                onClick={() => navigate('/inventario/cadastrar')}
                className="btn-create"
              >
                Cadastrar Novo Inventário
              </button>
            </>
          )}
        </div>
      </div>

      <div className="table-responsive">
        <table className="usuarios-table">
          <thead>
            <tr>
              <th>Nº</th>
              <th>Nome do serviço</th>
              <th>Sigla</th>
              <th>Resumo da atividade</th>
              <th>Diretoria</th>
              <th>Data Inserção</th>
              <th>Data Atualização</th>
              <th>Controlador</th>
              <th>Co-controlador</th>
              <th>Operador</th>
              <th>Email</th>
            </tr>
          </thead>
          <tbody>
            {itens.map(item => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.nome_servico}</td>
                <td>{item.sigla_servico}</td>
                <td>{item.resumo_atividade}</td>
                <td>{item.diretoria}</td>
                <td>{item.data_insercao}</td>
                <td>{item.data_atualizacao}</td>
                <td>{item.controlador}</td>
                <td>{item.co_controlador}</td>
                <td>{item.operador}</td>
                <td>{item.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}