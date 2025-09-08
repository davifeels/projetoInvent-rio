import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import '../pages/usuariosList.css';

export default function SetorDetalhes() {
  const { id } = useParams();
  const [usuarios, setUsuarios] = useState([]);
  const [erro, setErro] = useState('');
  const token = localStorage.getItem('accessToken');

  useEffect(() => {
    async function fetchUsuarios() {
      try {
        const res = await axios.get(`http://10.0.11.88:3000/api/setores/${id}/usuarios`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUsuarios(res.data);
      } catch (error) {
        setErro('Erro ao carregar usuários do setor');
      }
    }
    fetchUsuarios();
  }, [id, token]);

  if (erro) return <p style={{ color: 'red', textAlign: 'center' }}>{erro}</p>;

  return (
    <div className="usuarios-container">
      <h2>Usuários do Setor {id}</h2>
      <ul className="usuarios-list">
        {usuarios.map(user => (
          <li key={user.id}>{user.nome} ({user.email})</li>
        ))}
      </ul>
    </div>
  );
}
