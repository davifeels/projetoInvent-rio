import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createUsuario } from '../services/usuariosService'; 
import { createCadastro as requestCadastro } from '../services/cadastroService';
import { fetchSetores } from '../services/setoresService';
import { fetchFuncoes } from '../services/funcoesService';
import './cadastroUsuario.css';

export default function CadastroUsuario() {
  const navigate = useNavigate();
  const { usuario } = useAuth(); // contexto do usuário logado

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

  // Carrega funções, setores e perfis
  const carregarDadosDoFormulario = useCallback(async () => {
    setLoading(true);
    setErro('');
    try {
      const promises = [fetchFuncoes()];
      if (isMaster) promises.push(fetchSetores());

      const results = await Promise.all(promises);
      setFuncoes(results[0].data);
      if (isMaster) setSetores(results[1].data);

      const todosPerfis = [
        { id: "1", nome: "Master" },
        { id: "2", nome: "Coordenador" },
        { id: "3", nome: "Usuário" },
      ];

      if (isMaster) {
        setPerfisDisponiveis(todosPerfis.filter(p => p.id !== "1"));
      } else if (isCoordenador) {
        setPerfisDisponiveis(todosPerfis.filter(p => p.id === "3"));
        setFormData(prev => ({
          ...prev,
          tipo_usuario: 'USUARIO',
          perfil_id: '3',
          sigla_setor: usuario.sigla_setor
        }));
      }
    } catch (err) {
      console.error("Erro ao carregar dados do formulário:", err);
      setErro("Falha ao carregar opções. Tente recarregar a página.");
    } finally {
      setLoading(false);
    }
  }, [isMaster, isCoordenador, usuario]);

  useEffect(() => {
    if (usuario) carregarDadosDoFormulario();
  }, [usuario, carregarDadosDoFormulario]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setSucesso('');
    setLoading(true);

    try {
      if (formData.perfil_id === '2') {
        await createUsuario(formData);
        setSucesso('Coordenador cadastrado e ativo com sucesso!');
      } else {
        await requestCadastro(formData);
        setSucesso('Solicitação de cadastro enviada com sucesso! Aguarde aprovação.');
      }

      setTimeout(() => navigate('/usuarios'), 2000);
    } catch (error) {
      console.error('Erro ao cadastrar usuário:', error);

      // Tratamento de erros 400/401
      if (error.response) {
        if (error.response.status === 401) {
          setErro('Acesso não autorizado. Faça login novamente.');
        } else if (error.response.status === 400) {
          setErro(error.response.data?.message || 'Dados inválidos. Verifique os campos.');
        } else {
          setErro(error.response.data?.message || 'Erro ao cadastrar usuário.');
        }
      } else {
        setErro('Erro de conexão. Tente novamente.');
      }
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
            <input id="nome" type="text" name="nome" value={formData.nome} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" name="email" value={formData.email} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label htmlFor="senha">Senha Provisória</label>
            <input id="senha" type="password" name="senha" value={formData.senha} onChange={handleChange} required />
          </div>

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
              <input type="text" className="input-disabled"
                     value={`${usuario?.setor_nome ?? 'Setor não carregado'} (${usuario?.sigla_setor ?? 'N/A'})`}
                     disabled />
            ) : (
              <select id="sigla_setor" name="sigla_setor" value={formData.sigla_setor} onChange={handleChange} required>
                <option value="">Selecione o setor...</option>
                {setores.map(setor => (
                  <option key={setor.id} value={setor.sigla}>{setor.nome} ({setor.sigla})</option>
                ))}
              </select>
            )}
          </div>
        </div>

        <footer className="form-actions">
          <button type="button" className="btn-secondary" onClick={() => navigate('/usuarios')}>Cancelar</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar Usuário'}
          </button>
        </footer>
      </form>
    </div>
  );
}
