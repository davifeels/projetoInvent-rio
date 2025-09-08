import React, { useEffect, useState, useCallback } from 'react';
// ✅ CORREÇÃO: Caminhos ajustados para o padrão do projeto.
import api from '../api/axios'; // Sai da pasta 'pages' e entra na 'api'
import { exportAuditoriaExcel } from '../services/auditoriaService'; // Sai da pasta 'pages' e entra na 'services'
import './auditoria.css'; // Estilo específico da página

// Componente auxiliar para formatar os detalhes (sem alterações)
function DetalhesFormatados({ detalhesJson }) {
  if (!detalhesJson) {
    return <span>-</span>;
  }
  let detalhes;
  try {
    detalhes = typeof detalhesJson === 'string' ? JSON.parse(detalhesJson) : detalhesJson;
  } catch (e) {
    return <span>{detalhesJson}</span>;
  }
  const nomesAmigaveis = {
    ip: "Endereço IP",
    filtros_aplicados: "Filtros Aplicados",
    erro: "Detalhe Técnico do Erro",
    // ... outros mapeamentos
  };
  return (
    <div className="detalhes-container">
      {Object.entries(detalhes).map(([key, value]) => {
        let displayValue = typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value);
        if (key === 'ip' && (value === '::1' || value === '127.0.0.1')) {
          displayValue = `${value} (acesso local)`;
        }
        return (
          <div key={key} className="detalhe-item">
            <strong className="detalhe-chave">{nomesAmigaveis[key] || key.replace(/_/g, ' ')}:</strong>
            <span className={`detalhe-valor ${key === 'erro' ? 'texto-erro' : ''}`}>{displayValue}</span>
          </div>
        );
      })}
    </div>
  );
}

// Componente principal da página de Auditoria
export default function Auditoria() {
  const [auditorias, setAuditorias] = useState([]);
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(true);

  // --- Estados para a nova funcionalidade de exportação ---
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');

  const fetchAuditoria = useCallback(async () => {
    setLoading(true);
    setErro('');
    try {
      const res = await api.get('/auditoria');
      setAuditorias(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Erro ao carregar dados de auditoria:', err);
      setErro(err.response?.data?.message || 'Falha ao carregar dados de auditoria.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAuditoria();
  }, [fetchAuditoria]);

  // --- Função para lidar com a exportação ---
  const handleExport = async (e) => {
    e.preventDefault();
    setExportError('');

    if (!dataInicio || !dataFim) {
      setExportError('Por favor, selecione as datas de início e fim.');
      return;
    }

    setExporting(true);
    try {
      const params = { data_inicio: dataInicio, data_fim: dataFim };
      const response = await exportAuditoriaExcel(params);
      
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Relatorio_Auditoria_${dataInicio}_a_${dataFim}.xlsx`);
      document.body.appendChild(link);
      link.click();
      
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao exportar auditoria:', error);
      setExportError(error.response?.data?.message || 'Falha ao gerar o relatório.');
    } finally {
      setExporting(false);
    }
  };


  return (
    <div className="auditoria-container">
      <div className="auditoria-header">
        <h2>Log de Auditoria do Sistema</h2>
      </div>

      {/* --- Seção de Exportação --- */}
      <div className="export-panel">
        <h3>Exportar Relatório</h3>
        <form onSubmit={handleExport} className="export-form">
          <div className="form-group">
            <label htmlFor="dataInicio">Data de Início</label>
            <input 
              type="date" 
              id="dataInicio"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="dataFim">Data de Fim</label>
            <input 
              type="date" 
              id="dataFim"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-export" disabled={exporting}>
            {exporting ? 'Exportando...' : 'Exportar para Excel'}
          </button>
        </form>
        {exportError && <p className="status-message error export-error">{exportError}</p>}
      </div>


      {loading && <p className="status-message">Carregando auditoria...</p>}
      {erro && !loading && <p className="status-message error">{erro}</p>}

      {!loading && !erro && (
        <div className="table-responsive-auditoria">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Ação</th>
                <th>Usuário</th>
                <th>Setor</th>
                <th>Data/Hora</th>
                <th>Detalhes da Ação</th>
              </tr>
            </thead>
            <tbody>
              {auditorias.length > 0 ? (
                auditorias.map((log) => (
                  <tr key={log.id}>
                    <td>{log.id}</td>
                    <td>{log.acao}</td>
                    <td>{log.usuario_nome || 'Sistema'}</td>
                    <td>{log.setor_sigla || 'N/A'}</td>
                    <td>{log.data_acao_formatada}</td>
                    <td><DetalhesFormatados detalhesJson={log.detalhes} /></td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center' }}>Nenhum registro de auditoria encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
