import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './InventarioMasterView.css';

export default function InventarioMasterView() {
    const { usuario, loadingAuth } = useAuth();
    const navigate = useNavigate();
    const [inventarios, setInventarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [exporting, setExporting] = useState(false);

    const API_MASTER_ENDPOINT = '/admin/inventarios';
    const API_EXPORT_ENDPOINT = '/admin/inventarios/exportar/excel';
    const PROFILE_MASTER_ID = 1; // ID do perfil Master

    // Função para carregar todos os inventários (acesso Master)
    const carregarTodosInventarios = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await api.get(API_MASTER_ENDPOINT);
            setInventarios(response.data);
        } catch (err) {
            console.error("Erro ao carregar todos os inventários:", err);
            setError(err.response?.data?.message || 'Erro ao carregar inventários. Verifique suas permissões.');
            setInventarios([]);
        } finally {
            setLoading(false);
        }
    }, [API_MASTER_ENDPOINT]);

    // Efeito para verificar permissões e carregar dados ao montar o componente
    useEffect(() => {
        if (loadingAuth) return; // Espera a autenticação carregar

        // Redireciona se o usuário não for Master
        if (!usuario || usuario.perfil_id !== PROFILE_MASTER_ID) {
            console.warn("Acesso negado: Usuário não autenticado ou não é Master. Redirecionando...");
            navigate('/dashboard'); // Redireciona para o dashboard ou login
            return;
        }

        carregarTodosInventarios(); // Carrega os dados se tiver permissão

    }, [usuario, loadingAuth, navigate, carregarTodosInventarios, PROFILE_MASTER_ID]);

    // Handler para exportar os dados para Excel
    const handleExportExcel = async () => {
        setExporting(true); // Ativa o estado de exportação
        try {
            const response = await api.get(API_EXPORT_ENDPOINT, {
                responseType: 'blob' // Importantíssimo para receber o arquivo como binário
            });

            // Cria um URL temporário para o Blob e simula o download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'inventarios.xlsx'); // Nome do arquivo ao baixar
            document.body.appendChild(link);
            link.click(); // Dispara o download
            link.remove(); // Remove o elemento <a>
            window.URL.revokeObjectURL(url); // Libera o URL do Blob
        } catch (err) {
            console.error("Erro ao exportar Excel:", err);
            alert('Falha ao exportar o arquivo Excel. Tente novamente.');
        } finally {
            setExporting(false); // Desativa o estado de exportação
        }
    };

    // Renderiza mensagem de carregamento enquanto autenticação ou dados estão sendo carregados
    if (loadingAuth || loading) {
        return <div className="loading-container">Carregando relatórios...</div>;
    }

    // Renderiza mensagem de erro se houver falha no carregamento dos dados
    if (error) {
        return <div className="error-message-full-page">Erro: {error}</div>;
    }

    // Renderiza mensagem de acesso negado se o usuário não tiver permissão (após loadingAuth)
    if (!usuario || usuario.perfil_id !== PROFILE_MASTER_ID) {
        // Esta condição já é tratada no useEffect com redirecionamento,
        // mas pode servir como fallback visual rápido.
        return <div className="access-denied-message">Acesso negado. Você não tem permissão para visualizar esta página.</div>;
    }

    return (
        <div className="inventario-master-container">
            <header className="inventario-master-header">
                <h2>Relatórios de Inventário de Dados Pessoais</h2>
                <p>Visualização e gestão de todos os inventários cadastrados no sistema.</p>

                {/* ✅ NOVO: Botão de exportar em um contêiner separado para posicionamento */}
                <div className="inventario-export-button-wrapper">
                    <button 
                        className="btn-export-excel" 
                        onClick={handleExportExcel} 
                        disabled={exporting}
                        title="Exportar todos os inventários para Excel"
                    >
                        {exporting ? 'Exportando...' : 'Exportar Excel'}
                    </button>
                </div>
            </header>

            {/* Condição para exibir "nenhum inventário" ou a lista */}
            {inventarios.length === 0 && !error ? (
                <div className="no-inventarios">
                    <p>Nenhum inventário encontrado no sistema.</p>
                </div>
            ) : error ? (
                <div className="error-message-full-page">Erro: {error}</div>
            ) : (
                <div className="inventarios-list">
                    {inventarios.map((inv) => (
                        <div key={inv.id} className="inventario-card">
                            <h3>{inv.nome_servico || 'Serviço Não Nomeado'}</h3>
                            <p><strong>Sigla:</strong> {inv.sigla_servico || 'N/A'}</p>
                            <p><strong>Diretoria:</strong> {inv.diretoria || 'N/A'}</p>
                            <p><strong>Setor:</strong> {inv.setor_responsavel || 'N/A'}</p>
                            <p><strong>Finalidade:</strong> {inv.finalidade || 'N/A'}</p>
                            {/* ✅ REMOVIDO: Seção de ações do card individual */}
                            {/* <div className="card-actions">
                                <button className="btn-view-details" onClick={() => handleViewDetails(inv.id)}>
                                    Ver Detalhes
                                </button>
                            </div> */}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}