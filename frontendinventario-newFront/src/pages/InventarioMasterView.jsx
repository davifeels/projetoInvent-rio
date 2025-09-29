import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
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
    const PROFILE_MASTER_ID = 1;

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

    useEffect(() => {
        if (loadingAuth) return;

        if (!usuario || usuario.perfil_id !== PROFILE_MASTER_ID) {
            console.warn("Acesso negado: Usuário não autenticado ou não é Master. Redirecionando...");
            navigate('/dashboard');
            return;
        }

        carregarTodosInventarios();

    }, [usuario, loadingAuth, navigate, carregarTodosInventarios, PROFILE_MASTER_ID]);

    const handleExportExcel = async () => {
        setExporting(true);
        try {
            const response = await api.get(API_EXPORT_ENDPOINT, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'inventarios.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Erro ao exportar Excel:", err);
            alert('Falha ao exportar o arquivo Excel. Tente novamente.');
        } finally {
            setExporting(false);
        }
    };

    if (loadingAuth || loading) {
        return <div className="loading-container">Carregando relatórios...</div>;
    }

    if (error) {
        return <div className="error-message-full-page">Erro: {error}</div>;
    }

    if (!usuario || usuario.perfil_id !== PROFILE_MASTER_ID) {
        return <div className="access-denied-message">Acesso negado. Você não tem permissão para visualizar esta página.</div>;
    }

    return (
        <div className="inventario-master-container">
            <BackButton />
            
            <header className="inventario-master-header">
                <h2>Relatórios de Inventário de Dados Pessoais</h2>
                <p>Visualização e gestão de todos os inventários cadastrados no sistema.</p>

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
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}