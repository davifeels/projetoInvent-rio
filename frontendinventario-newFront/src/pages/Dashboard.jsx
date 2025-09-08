import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const { usuario, logout, loading } = useAuth();

  const PROFILE_MASTER_ID = 1;
  const PROFILE_GESTOR_ID = 2;
  const PROFILE_NORMAL_ID = 3;

  const allCards = [
    { title: 'Inventário Geral', icon: '📦', path: '/inventario', allowed: [PROFILE_MASTER_ID, PROFILE_GESTOR_ID] },
    { title: 'Gerenciar Usuários', icon: '👥', path: '/usuarios', allowed: [PROFILE_MASTER_ID, PROFILE_GESTOR_ID] },
    { title: 'Cadastrar Colaborador', icon: '🕴️', path: '/cadastros', allowed: [PROFILE_MASTER_ID] },
    { title: 'Gerenciar Setores', icon: '🏢', path: '/setores', allowed: [PROFILE_MASTER_ID] },
    { title: 'Auditoria do Sistema', icon: '📋', path: '/auditoria', allowed: [PROFILE_MASTER_ID, PROFILE_GESTOR_ID] },
    { title: 'Meu Inventário Pessoal', icon: '📝', path: '/meu-inventario', allowed: [PROFILE_MASTER_ID, PROFILE_GESTOR_ID, PROFILE_NORMAL_ID] },
    { title: 'Gerenciar Funções', icon: '🏷️', path: '/funcoes', allowed: [PROFILE_MASTER_ID] },
    { title: 'Relatórios Master', icon: '📈', path: '/admin/inventarios', allowed: [PROFILE_MASTER_ID] },
  ];

  if (loading) {
    return <div className="loading-container">A carregar...</div>;
  }
  if (!usuario) {
    return <div className="loading-container">A redirecionar para o login...</div>;
  }

  let visibleCards = [];
  let welcomeMessage = "Inventario de Tratamento de Dados Pessoais";
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
    <>
      {/* O BLOCO DA "CAIXA DE TESTE" FOI REMOVIDO DAQUI */}

      <div className="dashboard-wrapper">
        <main className="main-content">
          <header className="header">
            <h1 className="header-title">{welcomeMessage}</h1>
            <div className="header-user-info">
              <p className="user-greeting">Olá, {usuario?.nome || usuario?.email || 'usuário'}!</p>
              <button onClick={logout} className="logout-button">Sair</button>
            </div>
          </header>

          {showLimitedAccessMessage && (
            <p className="welcome-message">
              Seja bem-vindo! Para liberar o seu acesso completo, por favor, clique em "Meu Inventário" e preencha o formulário.
            </p>
          )}

          <div className="card-grid-scroll-container">
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
      </div>
    </>
  );
}