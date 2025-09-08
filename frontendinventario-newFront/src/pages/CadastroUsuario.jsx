// src/pages/CadastroUsuario.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createUsuario } from '../services/usuariosService';
import { fetchSetores } from '../services/setoresService';
import { fetchFuncoes } from '../services/funcoesService';
import './cadastroUsuario.css';

export default function CadastroUsuario() {
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const [formData, setFormData] = useState({
    nome: '', email: '', senha: '', perfil_id: '',
    funcao_id: '', sigla_setor: '', tipo_usuario: 'USUARIO', status: 'ativo',
  });

  const [setores, setSetores] = useState([]);
  const [funcoes, setFuncoes] = useState([]);
  const [perfisDisponiveis, setPerfisDisponiveis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const isCoordenador = usuario?.perfil_id === 2;
  const isMaster = usuario?.perfil_id === 1;

  const carregarDadosDoFormulario = useCallback(async () => {
    setLoading(true);
    setErro('');
    try {
      const promises = [fetchFuncoes()];
      if (isMaster) {
        promises.push(fetchSetores());
      }
      const results = await Promise.all(promises);
      const resFuncoes = results[0];
      setFuncoes(resFuncoes.data);

      if (isMaster) {
        const resSetores = results[1];
        setSetores(resSetores.data);
      }

      const todosPerfis = [
        { id: "1", nome: "Master" },
        { id: "2", nome: "Coordenador" },
        { id: "3", nome: "Usuário" },
      ];

      if (isMaster || isCoordenador) {
        setPerfisDisponiveis(todosPerfis.filter(p => p.id !== "1"));
      }

      if (isCoordenador) {
        setFormData(prev => ({ ...prev, sigla_setor: usuario.sigla_setor }));
      }

    } catch (err) {
      console.error("Erro ao carregar dados para o formulário:", err);
      setErro("Falha ao carregar opções. Tente recarregar a página.");
    } finally {
      setLoading(false);
    }
  }, [isMaster, isCoordenador, usuario]);

  useEffect(() => {
    if (usuario) {
      carregarDadosDoFormulario();
    }
  }, [usuario, carregarDadosDoFormulario]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setSucesso('');
    setLoading(true);

    const dadosParaEnviar = { ...formData };
    if (dadosParaEnviar.perfil_id === '2') {
        const nomeBase = dadosParaEnviar.nome.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/gi, '');
        dadosParaEnviar.email = `${nomeBase}.${dadosParaEnviar.sigla_setor.toLowerCase()}@dominio.com`;
        dadosParaEnviar.senha = Math.random().toString(36).slice(-8);
    }

    try {
      await createUsuario(dadosParaEnviar);
      setSucesso('Usuário cadastrado com sucesso!');
      setTimeout(() => navigate('/usuarios'), 2000);
    } catch (error) {
      console.error('Erro ao cadastrar usuário:', error);
      setErro(error.response?.data?.message || 'Erro ao cadastrar usuário. Verifique os dados.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="form-container"><p>Carregando formulário...</p></div>;
  }

  return (
    <div className="form-container">
      <form onSubmit={handleSubmit} className="form-layout" autoComplete="off">
        <header className="form-header">
          <h2>Cadastrar Novo Usuário</h2>
          <p>Preencha os dados para criar um novo acesso ao sistema.</p>
        </header>

        {erro && <p className="message error">{erro}</p>}
        {sucesso && <p className="message success">{sucesso}</p>}

        <div className="form-grid">
            <div className="form-group full-width">
                <label htmlFor="nome">Nome Completo</label>
                <input id="nome" type="text" name="nome" value={formData.nome} onChange={handleChange} required autoComplete="off" />
            </div>

            {formData.perfil_id !== '2' && (
                <>
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input id="email" type="email" name="email" value={formData.email} onChange={handleChange} required={formData.perfil_id !== '2'} autoComplete="off" />
                    </div>
                    <div className="form-group">
                        <label htmlFor="senha">Senha Provisória</label>
                        <input id="senha" type="password" name="senha" value={formData.senha} onChange={handleChange} required={formData.perfil_id !== '2'} autoComplete="new-password" />
                    </div>
                </>
            )}

            <div className="form-group">
              <label htmlFor="perfil_id">Perfil de Acesso</label>
              <select id="perfil_id" name="perfil_id" value={formData.perfil_id} onChange={handleChange} required>
                <option value="">Selecione o perfil...</option>
                {perfisDisponiveis.map(perfil => (
                  <option key={perfil.id} value={perfil.id}>{perfil.nome}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
                <label htmlFor="funcao_id">Função</label>
                <select id="funcao_id" name="funcao_id" value={formData.funcao_id} onChange={handleChange} required>
                    <option value="">Selecione a função...</option>
                    {funcoes.map(funcao => (<option key={funcao.id} value={funcao.id}>{funcao.nome}</option>))}
                </select>
            </div>

            <div className="form-group">
              <label htmlFor="sigla_setor">Setor</label>
              {isCoordenador ? (
                <input type="text" className="input-disabled" value={`${usuario?.setor_nome ?? 'Setor não carregado'} (${usuario?.sigla_setor ?? 'N/A'})`} disabled />
              ) : (
                <select id="sigla_setor" name="sigla_setor" value={formData.sigla_setor} onChange={handleChange} required>
                  <option value="">Selecione o setor...</option>
                  {setores.map(setor => ( <option key={setor.id} value={setor.sigla}>{setor.nome} ({setor.sigla})</option> ))}
                </select>
              )}
            </div>

            <div className="form-group">
                <label htmlFor="status">Status Inicial</label>
                <select id="status" name="status" value={formData.status} onChange={handleChange} required>
                    <option value="ativo">Ativo</option>
                    <option value="pendente">Pendente</option>
                    <option value="rejeitado">Rejeitado</option>
                </select>
            </div>
        </div>

        <footer className="form-actions">
          <button type="button" className="btn-secondary" onClick={() => navigate('/usuarios')}>Cancelar</button>
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Salvando...' : 'Salvar Usuário'}</button>
        </footer>
      </form>
    </div>
  );
}