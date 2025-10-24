import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';
import './Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const { usuario, logout, loading } = useAuth();

  const PROFILE_MASTER_ID = 1;
  const PROFILE_GESTOR_ID = 2;
  const PROFILE_NORMAL_ID = 3;

  const allCards = [
    { title: 'Gerenciar Usuários', icon: '👥', path: '/usuarios', allowed: [PROFILE_MASTER_ID, PROFILE_GESTOR_ID] },
    { title: 'Gerenciar Setores', icon: '🏢', path: '/setores', allowed: [PROFILE_MASTER_ID] },
    { title: 'Auditoria do Sistema', icon: '📋', path: '/auditoria', allowed: [PROFILE_MASTER_ID, PROFILE_GESTOR_ID] },
    { title: 'Meu Inventário Pessoal', icon: '📝', path: '/meu-inventario', allowed: [PROFILE_MASTER_ID, PROFILE_GESTOR_ID, PROFILE_NORMAL_ID] },
    { title: 'Gerenciar Funções', icon: '🏷️', path: '/funcoes', allowed: [PROFILE_MASTER_ID] },
    { title: 'Relatórios de Inventários', icon: '📈', path: '/admin/inventarios', allowed: [PROFILE_MASTER_ID, PROFILE_GESTOR_ID] },
  ];

  if (loading) {
    return <div className="loading-container">A carregar...</div>;
  }
  
  if (!usuario) {
    return <div className="loading-container">A redirecionar para o login...</div>;
  }

  let visibleCards = [];
  let welcomeMessage = "Inventário de Tratamento de Dados Pessoais";
  let showLimitedAccessMessage = false;

  if (usuario.status === 'ativo_inventario_pendente') {
    visibleCards = allCards.filter(card => card.path === '/meu-inventario');
    welcomeMessage = "Complete o seu Cadastro";
    showLimitedAccessMessage = true;
  } else {
    visibleCards = allCards.filter(c => c.allowed.includes(usuario.perfil_id));
  }

  const gridClassName = `card-grid ${visibleCards.length === 1 ? 'single-item' : ''}`;

  return (
    <div className="dashboard-page">
      {/* Header com logo, título e botão Sair */}
      <header className="dashboard-header">
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

      {/* Conteúdo principal */}
      <main className="dashboard-content">
        <h2 className="dashboard-main-title">{welcomeMessage}</h2>

        {showLimitedAccessMessage && (
          <p className="welcome-message">
            Seja bem-vindo! Para liberar o seu acesso completo, por favor, clique em "Meu Inventário" e preencha o formulário.
          </p>
        )}

        <div className="card-grid-container">
          <section className={gridClassName}>
            {visibleCards.length > 0 ? (
              visibleCards.map((card) => (
                <div
                  key={card.title}
                  className="card"
                  onClick={() => navigate(card.path)}
                  role="button"
                  tabIndex={0}
                  data-path={card.path}
                >
                  <span className="card-icon">{card.icon}</span>
                  <h3 className="card-title-text">{card.title}</h3>
                </div>
              ))
            ) : (
              <p className="no-cards-message">Nenhuma funcionalidade disponível para o seu perfil.</p>
            )}
          </section>
        </div>
      </main>

      {/* Footer com logo */}
      <footer className="dashboard-footer">
        <img 
          src={logo}
          alt="Logo Footer" 
          className="footer-logo"
        />
      </footer>
    </div>
  );
}