import React from 'react';

export default function UsuarioItem({ usuario, onEdit, onDelete }) {
  // Função auxiliar para converter perfil_id para nome do perfil
  const getNomePerfil = (perfilId) => {
    if (perfilId === 1) return 'Master';
    if (perfilId === 2) return 'Coordenador';
    if (perfilId === 3) return 'Usuário';
    return 'Desconhecido';
  };

  return (
    <tr>
      <td>{usuario.id}</td>
      <td>{usuario.nome}</td>
      <td>{usuario.email}</td>
      {/* Exibe o nome do perfil em vez do ID */}
      <td>{getNomePerfil(usuario.perfil_id)}</td>
      {/* Exibe o tipo_usuario (que pode ser o mesmo que o perfil ou mais específico) */}

      <td>{usuario.sigla_setor || '-'}</td>
      <td>{usuario.status}</td> {/* <<< CÉLULA ADICIONADA */}
      <td>
        <button className="edit-btn" onClick={() => onEdit(usuario)}>Editar</button>
        <button className="delete-btn" onClick={() => onDelete(usuario.id)}>Excluir</button>
        {/* Se você tiver lógica de Aprovar/Rejeitar usuários PENDENTES nesta lista,
            os botões poderiam ser adicionados aqui condicionalmente:
        {usuario.status === 'PENDENTE' && (
          <>
            <button className="approve-btn" onClick={() => onAprovar(usuario.id)}>Aprovar</button>
            <button className="reject-btn" onClick={() => onRejeitar(usuario.id)}>Rejeitar</button>
          </>
        )}
        Lembre-se de passar onAprovar e onRejeitar como props se for usar.
        */}
      </td>
    </tr>
  );
}
