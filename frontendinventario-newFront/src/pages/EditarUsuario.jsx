import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchUsuarioPorId, updateUsuario } from '../services/usuariosService';
import { fetchSetores } from '../services/setoresService';
import { fetchFuncoes } from '../services/funcoesService';
import { useAuth } from '../context/AuthContext';
import BackButton from '../components/BackButton';
import './EditarUsuario.css';

export default function EditarUsuario() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario: usuarioLogado } = useAuth();

  const [formData, setFormData] = useState({
    nome: '', email: '', perfil_id: '', setor_id: '', funcao_id: '', status: ''
  });
  const [novaSenha, setNovaSenha] = useState('');

  const [setores, setSetores] = useState([]);
  const [funcoes, setFuncoes] = useState([]);
  const [perfis, setPerfis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ erro: '', sucesso: '' });

  const carregarDados = useCallback(async () => {
    try {
      const [resUsuario, resSetores, resFuncoes] = await Promise.all([
        fetchUsuarioPorId(id),
        fetchSetores(),
        fetchFuncoes()
      ]);
      const usuario = resUsuario.data;
      setFormData({
        nome: usuario.nome, email: usuario.email, perfil_id: usuario.perfil_id.toString(),
        setor_id: usuario.setor_id.toString(), funcao_id: usuario.funcao_id.toString(), status: usuario.status
      });
      setSetores(resSetores.data);
      setFuncoes(resFuncoes.data);
      const perfisDisponiveis = [{ id: "1", nome: "Master" }, { id: "2", nome: "Coordenador" }, { id: "3", nome: "Usuário" }];
      if (usuarioLogado?.perfil_id === 1) { setPerfis(perfisDisponiveis); } else { setPerfis(perfisDisponiveis.filter(p => p.id !== "1")); }
    } catch (err) {
      setFeedback({ erro: 'Falha ao carregar os dados para edição.', sucesso: '' });
    } finally {
      setLoading(false);
    }
  }, [id, usuarioLogado]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFeedback({ erro: '', sucesso: '' });

    const dadosParaEnviar = {
      nome: formData.nome,
      email: formData.email,
      perfil_id: parseInt(formData.perfil_id, 10),
      setor_id: parseInt(formData.setor_id, 10),
      funcao_id: parseInt(formData.funcao_id, 10),
      status: formData.status,
    };

    if (novaSenha.trim() !== '') {
      if (novaSenha.trim().length < 6) {
        setFeedback({ erro: 'A nova senha deve ter no mínimo 6 caracteres.', sucesso: '' });
        setLoading(false);
        return;
      }
      dadosParaEnviar.senha = novaSenha.trim();
    }

    try {
      await updateUsuario(id, dadosParaEnviar);
      setFeedback({ sucesso: 'Usuário atualizado com sucesso!', erro: '' });
      setTimeout(() => navigate('/usuarios'), 2000);
    } catch (err) {
      console.error("Erro ao atualizar usuário:", err);
      setFeedback({ erro: err.response?.data?.message || 'Erro ao atualizar. Tente novamente.', sucesso: '' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="editar-usuario-container"><BackButton /><p>Carregando...</p></div>;

  return (
    <div className="editar-usuario-container">
      <BackButton />
      
      <h2>Editar Usuário</h2>
      {feedback.erro && <p className="feedback-message error-message">{feedback.erro}</p>}
      {feedback.sucesso && <p className="feedback-message success-message">{feedback.sucesso}</p>}
      
      <form onSubmit={handleSubmit} className="editar-usuario-form">
        <div className="form-group">
          <label htmlFor="nome">Nome</label>
          <input id="nome" name="nome" type="text" value={formData.nome} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label htmlFor="novaSenha">Nova Senha (opcional)</label>
          <input id="novaSenha" name="novaSenha" type="password" placeholder="Deixe em branco para não alterar" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} />
        </div>

        <div className="form-group">
          <label htmlFor="perfil_id">Perfil</label>
          <select id="perfil_id" name="perfil_id" value={formData.perfil_id} onChange={handleChange} required>
            <option value="">Selecione um Perfil</option>
            {perfis.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="setor_id">Setor</label>
          <select id="setor_id" name="setor_id" value={formData.setor_id} onChange={handleChange} required>
            <option value="">Selecione um Setor</option>
            {setores.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="funcao_id">Função</label>
          <select id="funcao_id" name="funcao_id" value={formData.funcao_id} onChange={handleChange} required>
            <option value="">Selecione uma Função</option>
            {funcoes.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="status">Status</label>
          <select id="status" name="status" value={formData.status} onChange={handleChange} required>
            <option value="ativo">Ativo</option>
            <option value="pendente">Pendente</option>
            <option value="rejeitado">Rejeitado</option>
            <option value="ativo_inventario_pendente">Ativo (Inventário Pendente)</option>
          </select>
        </div>

        <div className="form-actions">
          <button type="button" className="btn-cancelar" onClick={() => navigate('/usuarios')}>Cancelar</button>
          <button type="submit" className="btn-atualizar" disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>
    </div>
  );
}