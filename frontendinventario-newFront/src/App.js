// frontend/src/App.js

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Componentes de Página
import Login from './Login/Login';
import RequestAccess from './pages/RequestAccess';
import Dashboard from './pages/Dashboard';
import Usuarios from './pages/Usuarios';
import CadastroUsuario from './pages/CadastroUsuario';
import EditarUsuario from './pages/EditarUsuario';
import Setores from './pages/Setores';
import Funcoes from './Funcoes/Funcoes';
import Auditoria from './pages/Auditoria';
import InventarioPessoal from './pages/InventarioPessoal';
import InventarioMasterView from './pages/InventarioMasterView';

import PrivateRoute from './components/PrivateRoute';
import SetorDetalhes from './components/SetorDetalhes';

export default function App() {
  const PROFILE_MASTER_ID = 1;
  const PROFILE_GESTOR_ID = 2;
  const PROFILE_NORMAL_ID = 3;

  return (
    <Routes>
      {/* ------------------- Rotas Públicas ------------------- */}
      <Route path="/login" element={<Login />} />
      <Route path="/request-access" element={<RequestAccess />} />
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* ------------------- Rotas Protegidas ------------------- */}
      <Route
        path="/dashboard"
        element={
          <PrivateRoute allowedProfiles={[PROFILE_MASTER_ID, PROFILE_GESTOR_ID, PROFILE_NORMAL_ID]}>
            <Dashboard />
          </PrivateRoute>
        }
      />

      {/* --- Gestão de Usuários --- */}
      <Route
        path="/usuarios"
        element={
          <PrivateRoute allowedProfiles={[PROFILE_MASTER_ID, PROFILE_GESTOR_ID]}>
            <Usuarios />
          </PrivateRoute>
        }
      />
      <Route
        path="/usuarios/novo"
        element={
          <PrivateRoute allowedProfiles={[PROFILE_MASTER_ID, PROFILE_GESTOR_ID]}>
            <CadastroUsuario />
          </PrivateRoute>
        }
      />
      <Route
        path="/usuarios/editar/:id"
        element={
          <PrivateRoute allowedProfiles={[PROFILE_MASTER_ID, PROFILE_GESTOR_ID]}>
            <EditarUsuario />
          </PrivateRoute>
        }
      />

      {/* --- Gestão Administrativa --- */}
      <Route
        path="/setores"
        element={
          <PrivateRoute allowedProfiles={[PROFILE_MASTER_ID]}>
            <Setores />
          </PrivateRoute>
        }
      />
      <Route
        path="/setores/:id"
        element={
          <PrivateRoute allowedProfiles={[PROFILE_MASTER_ID, PROFILE_GESTOR_ID]}>
            <SetorDetalhes />
          </PrivateRoute>
        }
      />
      <Route
        path="/funcoes"
        element={
          <PrivateRoute allowedProfiles={[PROFILE_MASTER_ID]}>
            <Funcoes />
          </PrivateRoute>
        }
      />
      <Route
        path="/auditoria"
        element={
          <PrivateRoute allowedProfiles={[PROFILE_MASTER_ID, PROFILE_GESTOR_ID]}>
            <Auditoria />
          </PrivateRoute>
        }
      />

      {/* --- Gestão de Inventário --- */}
      <Route
        path="/meu-inventario"
        element={
          <PrivateRoute allowedProfiles={[PROFILE_MASTER_ID, PROFILE_GESTOR_ID, PROFILE_NORMAL_ID]}>
            <InventarioPessoal />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/inventarios"
        element={
          <PrivateRoute allowedProfiles={[PROFILE_MASTER_ID, PROFILE_GESTOR_ID]}>
            <InventarioMasterView />
          </PrivateRoute>
        }
      />

      {/* Rota "catch-all" */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}