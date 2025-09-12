import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createUsuario } from '../services/usuariosService';
import { fetchSetores } from '../services/setoresService';
import { fetchFuncoes } from '../services/funcoesService';
import './cadastroUsuario.css';

export default function CadastroUsuario() {
  const navigate = useNavigate();
  const { usuario } = useAuth(); // Usuário logado

  // Estado inicial do formulário, perfil 'Usuário' como padrão
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    perfil_id: '3', // Inicia com 'Usuário' selecionado
    funcao_id: '',
    sigla_setor: '',
    status: 'ativo',
  });

  // Estados para os dados dos dropdowns
  const [setores, setSetores] = useState([]);
  const [funcoes, setFuncoes] = useState([]);
  const [perfisDisponiveis, setPerfisDisponiveis] = useState([]);

  // Estados para controle da UI
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  // Verifica o perfil do usuário logado
  const isMaster = usuario?.perfil_id === 1;
  const isCoordenador = usuario?.perfil_id === 2;

  // Carrega os dados necessários para os campos <select> do formulário
  const carregarDadosDoFormulario = useCallback(async () => {
    setLoading(true);
    setErro('');
    try {
      // Busca as funções (necessário para todos)
      const resFuncoes = await fetchFuncoes();
      setFuncoes(resFuncoes.data);

      // Define os perfis que o usuário logado pode criar
      const todosPerfis = [
        { id: "1", nome: "Master" },
        { id: "2", nome: "Coordenador" },
        { id: "3", nome: "Usuário" },
      ];
      
      // Master pode criar Coordenador e Usuário
      if (isMaster) {
        setPerfisDisponiveis(todosPerfis.filter(p => p.id !== "1")); 
        const resSetores = await fetchSetores(); // Master também carrega todos os setores
        setSetores(resSetores.data);
      } 
      // Coordenador só pode criar Usuário
      else if (isCoordenador) {
        setPerfisDisponiveis(todosPerfis.filter(p => p.id === "3"));
        // Define o setor do formulário como o setor do Coordenador logado
        setFormData(prev => ({ ...prev, sigla_setor: usuario.sigla_setor }));
      }

    } catch (err) {
      console.error("Erro ao carregar dados para o formulário:", err);
      setErro("Falha ao carregar opções. Tente recarregar a página.");
    } finally {
      setLoading(false);
    }
  }, [isMaster, isCoordenador, usuario]);

  // Executa o carregamento dos dados quando o componente é montado
  useEffect(() => {
    if (usuario) {
      carregarDadosDoFormulario();
    }
  }, [usuario, carregarDadosDoFormulario]);

  // Atualiza o estado do formulário a cada mudança nos inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Lida com o envio do formulário
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setSucesso('');
    setLoading(true);

    // Prepara os dados para envio, convertendo IDs para números
    const dadosParaEnviar = {
      ...formData,
      perfil_id: parseInt(formData.perfil_id, 10),
      funcao_id: parseInt(formData.funcao_id, 10),
      // <<< CORREÇÃO APLICADA AQUI >>>
      // Adiciona o campo 'tipo_usuario' que o backend espera.
      tipo_usuario: parseInt(formData.perfil_id, 10) === 2 ? 'COORDENADOR' : 'USUARIO',
    };

    try {
      await createUsuario(dadosParaEnviar);
      setSucesso('Usuário cadastrado com sucesso!');
      setTimeout(() => navigate('/usuarios'), 2000); // Redireciona após 2 segundos
    } catch (error) {
      console.error('Erro ao cadastrar usuário:', error);
      setErro(error.response?.data?.message || 'Erro ao cadastrar usuário. Verifique os dados.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !sucesso) {
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
            <label htmlFor="email">Email</label>
            <input id="email" type="email" name="email" value={formData.email} onChange={handleChange} required autoComplete="off" />
          </div>
          <div className="form-group">
            <label htmlFor="senha">Senha Provisória</label>
            <input id="senha" type="password" name="senha" value={formData.senha} onChange={handleChange} required minLength="6" autoComplete="new-password" />
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
            {/* Se for Coordenador, mostra um campo desabilitado com o setor dele */}
            {isCoordenador ? (
              <input type="text" className="input-disabled" value={usuario?.sigla_setor || 'N/A'} disabled />
            ) : (
            /* Se for Master, mostra um dropdown com todos os setores */
              <select id="sigla_setor" name="sigla_setor" value={formData.sigla_setor} onChange={handleChange} required>
                <option value="">Selecione o setor...</option>
                {setores.map(setor => (<option key={setor.id} value={setor.sigla}>{setor.nome} ({setor.sigla})</option>))}
              </select>
            )}
          </div>
        </div>

        <footer className="form-actions">
          <Link to="/usuarios" className="btn-secondary">Cancelar</Link>
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Salvando...' : 'Salvar Usuário'}</button>
        </footer>
      </form>
    </div>
  );
}

