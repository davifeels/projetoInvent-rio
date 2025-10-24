import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import BackButton from '../components/BackButton';
import './InventarioMasterView.css';

export default function InventarioMasterView() {
    const { usuario, logout, loadingAuth } = useAuth();
    const navigate = useNavigate();

    const [inventarios, setInventarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [exporting, setExporting] = useState(false);

    const API_MASTER_ENDPOINT = '/admin/inventarios';
    const API_EXPORT_ENDPOINT = '/admin/inventarios/exportar/excel';
    const PROFILE_MASTER_ID = 1;
    const PROFILE_GESTOR_ID = 2;

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

        if (!usuario || (usuario.perfil_id !== PROFILE_MASTER_ID && usuario.perfil_id !== PROFILE_GESTOR_ID)) {
            console.warn("Acesso negado: Usuário não autenticado ou não tem permissão. Redirecionando...");
            navigate('/dashboard');
            return;
        }

        carregarTodosInventarios();

    }, [usuario, loadingAuth, navigate, carregarTodosInventarios, PROFILE_MASTER_ID, PROFILE_GESTOR_ID]);

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

    if (!usuario || (usuario.perfil_id !== PROFILE_MASTER_ID && usuario.perfil_id !== PROFILE_GESTOR_ID)) {
        return <div className="access-denied-message">Acesso negado. Você não tem permissão para visualizar esta página.</div>;
    }

    return (
        <div className="inventario-master-page">
            <header className="inventario-master-page-header">
                <div className="header-left">
                    <img src={logo} alt="Logo" className="header-logo" />
                    <div className="header-text">
                        <h1 className="header-title">Inventário LGPD</h1>
                        <p className="header-subtitle">Gestão Inteligente e Segurança de Dados</p>
                    </div>
                </div>
                <div className="header-right">
                    <p className="user-greeting">Olá, {usuario?.nome || usuario?.email || 'usuário'}!</p>
                    <button onClick={logout} className="logout-button">Sair</button>
                </div>
            </header>

            <main className="inventario-master-content">
                <BackButton />
                
                <header className="inventario-master-header">
                    <h2>Relatórios de Inventário de Dados Pessoais</h2>
                    <button 
                        className="btn-export-excel" 
                        onClick={handleExportExcel} 
                        disabled={exporting}
                        title="Exportar todos os inventários para Excel"
                    >
                        {exporting ? 'Exportando...' : 'Exportar Excel'}
                    </button>
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
                                <p><strong>Sigla</strong> {inv.sigla_servico || 'N/A'}</p>
                                <p><strong>Diretoria</strong> {inv.diretoria || 'N/A'}</p>
                                <p><strong>Setor</strong> {inv.setor_responsavel || 'N/A'}</p>
                                <p><strong>Finalidade</strong> {inv.finalidade || 'N/A'}</p>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            <footer className="inventario-master-page-footer">
                <img 
                    src={logo}
                    alt="Logo Footer" 
                    className="footer-logo"
                />
            </footer>
        </div>
    );
}