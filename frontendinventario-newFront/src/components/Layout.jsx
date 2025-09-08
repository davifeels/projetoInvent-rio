import React from 'react';
import { Outlet } from 'react-router-dom';

// Importe seu componente de menu lateral (Sidebar) aqui se ele for separado.
// Por enquanto, vamos criar uma estrutura simples.
import './Layout.css'; 

export default function Layout() {
  return (
    <div className="app-layout">
      <aside className="app-sidebar">
        {/* Aqui entraria o seu componente de menu lateral.
          Ex: <Sidebar /> 
          Por enquanto, pode deixar um placeholder ou os links.
        */}
        <h3>Menu</h3>
        <nav>
          <a href="/dashboard">Dashboard</a>
          <a href="/usuarios">Usuários</a>
          <a href="/inventario">Inventário</a>
          {/* Adicione outros links do menu aqui */}
        </nav>
      </aside>
      
      <main className="app-content">
        {/* O <Outlet /> é um placeholder especial do React Router. */}
        {/* É aqui que as suas páginas (Dashboard, Usuarios, etc.) serão renderizadas. */}
        <Outlet />
      </main>
    </div>
  );
}
