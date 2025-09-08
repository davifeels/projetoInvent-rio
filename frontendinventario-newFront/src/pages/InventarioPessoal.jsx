// src/pages/InventarioPessoal.jsx
import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import './InventarioPessoal.css';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import { FaLock } from 'react-icons/fa';

// --- Opções para os campos de seleção ---
const optionsDiretoria = ["CGICP", "BIAFE", "PPE", "GABIN", "AUDIN", "CGRCP", "COCOP", "OUV", "ASCOM", "DIPOA", "DITEG", "DAFN", "DRTI", "ASSESSOR DITI", "ASSESSOR PRESI"];
const optionsDadosComuns = ["Nome", "RG", "CPF", "CNH", "Nº PASSAPORTE", "TÍTULO DE ELEITOR", "ESTADO CIVIL", "NACIONALIDADE", "ENDEREÇO", "Nº REGISTRO PROFISSIONAL", "Nº TELEFONE FIXO", "Nº TELEFONE CELULAR", "EMAIL PESSOAL", "ENDEREÇO IP", "GPS/LOCALIZAÇÃO", "Outros"];
const optionsDadosSensiveis = ["Origem racial", "Convicção religiosa", "Opinião política", "Filiação a sindicato", "Filiação a organização de caráter religioso", "Filiação ou crença filosófica", "Dados referentes à saúde ou à vida sexual", "Dados genéticos", "Dados biométricos", "Outros"];
const optionsCategoriasTitulares = ["O PRÓPRIO TITULAR", "CAPTURA DE DADOS", "API, ARQUIVOS, EMAIL", "Outros"];
const optionsHipoteseTratamento = ["Consentimento do titular", "Cumprimento de obrigação legal ou regulatória", "Execução de políticas públicas", "Estudos por órgão de pesquisa", "Execução de contrato", "Exercício regular de direitos em processo", "Proteção da vida", "Tutela da saúde", "Interesse legítimo do controlador", "Proteção do crédito"];
const optionsPrincipiosLGPD = ["Finalidade", "Adequação", "Necessidade", "Livre Acesso", "Qualidade dos Dados", "Transparência", "Segurança", "Prevenção", "Não Discriminação", "Responsabilização e Prestação de Contas"];
const optionsCompartilhamento = ["Apenas com o meu setor", "No ITI", "Com entidades externas"];
const optionsTransferencia = ["Não se aplica", "Países com nível de proteção adequado", "Cláusulas contratuais padrão", "Normas corporativas globais", "Autorização da ANPD"];
const optionsMedidasSeguranca = ["Controle de Acesso", "Autenticação", "Auditoria e Monitoramento", "Segregação de Função", "Gestão de Logs", "Criptografia", "Prevenção e Detecção de Intrusão"];

// Mapeamento dos comentários para os campos do formulário
const formFieldComments = {
  nome_servico: "Este campo refere-se ao nome do serviço ou processo de negócio para o qual os dados pessoais são coletados. Use um nome claro e descritivo.",
  sigla_servico: "A sigla abreviada do serviço ou processo, se houver. Caso contrário, pode-se deixar essa coluna em branco ou colocar “Não se aplica”.",
  resumo_atividade: "Preencha a coluna 'Resumo da Atividade' com as informações da atividade de tratamento sob sua responsabilidade, se houver processo de negócio. Exemplo: se a atividade for o processo de credenciamento ou processo de contratação, então deve-se preencher essas colunas com os respectivos nomes dos processos. Caso contrário, se for uma atividade específica ou rotina deve-se detalhar as informações da atividade de tratamento. Exemplo: atividade de tratamento relacionada ao processo de solicitação de passaporte.",
  diretoria: "Preencha a coluna 'Diretoria' com a sigla da diretoria da atividade de tratamento sob sua responsabilidade. Exemplo: Diretoria de Auditoria, Integridade e Governança – AUDIN, Diretoria de Infraestrutura de Chaves Públicas – DICGP.",
  setor_responsavel: "Preencha a coluna 'Setor Responsável' com a sigla do setor responsável pela atividade de tratamento sob sua responsabilidade. Exemplo: Coordenação-Geral de Normas e Fiscalização – CGNF, Coordenação-Geral de Desenvolvimento – CGDEV.",
  controlador: "Preencha a coluna 'Controlador' com o nome ou a sigla do Controlador da atividade de tratamento sob sua responsabilidade. Exemplo: ITI.",
  co_controlador: "Preencha a coluna 'Co-controlador' com o nome ou a sigla do Co-Controlador da atividade de tratamento sob sua responsabilidade, se houver. Caso não houver Co-Controlador na atividade de tratamento, pode-se deixar essa coluna em branco ou colocar “Não se aplica”.",
  operador: "Preencha a coluna 'Operador' com o nome ou a sigla do Operador da atividade de tratamento sob sua responsabilidade, se houver. Caso não houver Operador na atividade de tratamento, pode-se deixar essa coluna em branco ou colocar “Não se aplica”.",
  canal_titular: "Este é o canal de contato oficial para o titular dos dados. Este campo não pode ser alterado.",
  dados_pessoais_comuns: "Selecione todos os tipos de dados pessoais comuns que são coletados ou tratados. Se o dado que você coleta não estiver na lista, marque 'Outros' e especifique.",
  outros_dados_comuns: "Por favor, especifique aqui os outros dados pessoais comuns que são coletados.",
  dados_pessoais_sensiveis: "Selecione todos os tipos de dados pessoais sensíveis que são coletados. Se o dado que você coleta não estiver na lista, marque 'Outros' e especifique.",
  outros_dados_sensiveis: "Por favor, especifique aqui os outros dados pessoais sensíveis que são coletados.",
  categorias_titulares: "Identifique a fonte de coleta dos dados ou as categorias dos titulares. Se a fonte/categoria não estiver na lista, marque 'Outros' e especifique.",
  outros_categorias_titulares: "Por favor, especifique aqui a outra fonte de coleta ou categoria de titular.",
  finalidade: "Descreva o propósito para o qual os dados pessoais são coletados e utilizados, de forma clara, específica e explícita. Exemplo: Para realização de prova de vida.",
  hipotese_tratamento: "Selecione a hipótese legal (base legal) que justifica o tratamento dos dados pessoais, conforme os Art. 7º e 11 da LGPD.",
  principios_lgpd: "Selecione os princípios da LGPD que são atendidos por esta atividade de tratamento de dados pessoais, conforme Art. 6º da LGPD.",
  compartilhamento_detalhes: "Indique as entidades ou níveis com os quais os dados pessoais são compartilhados nesta atividade.",
  finalidade_compartilhamento: "Descreva a finalidade específica do compartilhamento dos dados pessoais com terceiros. Exemplo: Realização de prova de vida.",
  transferencia_internacional: "Informe se há transferência de dados pessoais para fora do Brasil e, em caso afirmativo, selecione a modalidade de transferência.",
  paises_transferencia: "Liste o(s) país(es) de destino para onde os dados pessoais são transferidos internacionalmente. Se não houver transferência internacional, deixe em branco ou 'Não se aplica'.",
  garantias_transferencia: "Descreva as garantias adotadas para assegurar a proteção dos dados pessoais em casos de transferência internacional. Exemplo: Cláusulas contratuais padrão, normas corporativas globais, Autorização da ANPD. Se não houver, deixe em branco ou 'Não se aplica'.",
  periodo_retencao: "Especifique o período de tempo durante o qual os dados pessoais serão armazenados para esta finalidade. Exemplo: Pelo período de 5 (cinco) anos, conforme Lei 9.789/99.",
  forma_eliminacao: "Indique a forma como os dados pessoais serão eliminados após o término do período de retenção ou da finalidade de tratamento. Exemplo: Anonimizado, excluído.",
  medidas_seguranca: "Selecione as medidas de segurança técnicas e administrativas que são aplicadas na atividade de tratamento para proteger os dados pessoais.",
};

const initialState = {
  nome_servico: '', sigla_servico: '', resumo_atividade: '', diretoria: '', setor_responsavel: '',
  controlador: 'ITI', co_controlador: '', operador: '', canal_titular: 'privacidade@iti.gov.br',
  dados_pessoais_comuns: [], outros_dados_comuns: '',
  dados_pessoais_sensiveis: [], outros_dados_sensiveis: '',
  categorias_titulares: [], outros_categorias_titulares: '',
  finalidade: '', hipotese_tratamento: '', principios_lgpd: [],
  compartilhamento_detalhes: [], finalidade_compartilhamento: '',
  transferencia_internacional: 'Não se aplica', paises_transferencia: '', garantias_transferencia: '',
  medidas_seguranca: [], periodo_retencao: '', forma_eliminacao: '',
};

export default function InventarioPessoal() {
  const { usuario, logout } = useAuth();
  const [dadosDoInventario, setDadosDoInventario] = useState(null);
  const [formData, setFormData] = useState(initialState);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const API_ENDPOINT = '/inventario-pessoal';

  const carregarDados = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get(API_ENDPOINT);
      if (response.status === 204 || !response.data) {
        // Se não houver inventário, prepara para criar um novo
        setDadosDoInventario(null);
        setFormData(initialState);
        setIsEditing(true);
      } else {
        // Se houver inventário, preenche os dados para exibição
        const dadosDoBanco = { ...initialState, ...response.data };
        dadosDoBanco.canal_titular = 'privacidade@iti.gov.br';
        setDadosDoInventario(dadosDoBanco);
        setFormData(dadosDoBanco);
        setIsEditing(false); // Começa no modo de visualização
      }
    } catch (error) {
      // Em caso de erro (ex: 404), também prepara para criar um novo
      setDadosDoInventario(null);
      setFormData(initialState);
      setIsEditing(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (usuario) carregarDados(); }, [usuario, carregarDados]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      const newValues = checked
        ? [...(formData[name] || []), value]
        : (formData[name] || []).filter(item => item !== value);
      const newState = { ...formData, [name]: newValues };
      if (name === 'dados_pessoais_comuns' && !newValues.includes('Outros')) newState.outros_dados_comuns = '';
      if (name === 'dados_pessoais_sensiveis' && !newValues.includes('Outros')) newState.outros_dados_sensiveis = '';
      if (name === 'categorias_titulares' && !newValues.includes('Outros')) newState.outros_categorias_titulares = '';
      setFormData(newState);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setSucesso('');
    setLoading(true);

    try {
      await api.post(API_ENDPOINT, formData);
      setSucesso('Inventário salvo com sucesso!');

      if (usuario?.status === 'ativo_inventario_pendente') {
        alert("Inventário salvo! Sua conta foi ativada. Por favor, faça o login novamente para ver seu acesso completo.");
        logout();
      } else {
        // ATUALIZAÇÃO: Transição suave para a tela de visualização
        setDadosDoInventario(formData); // Usa os dados do formulário para exibir
        setIsEditing(false); // Muda para o modo de visualização
      }
    } catch (error) {
      setErro(error.response?.data?.message || 'Erro ao salvar o inventário.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Tem certeza que deseja excluir permanentemente seu inventário?")) {
      try {
        await api.delete(API_ENDPOINT);
        setDadosDoInventario(null);
        setFormData(initialState);
        setIsEditing(true); // Volta para a tela de preenchimento
        alert('Inventário excluído com sucesso.');
      } catch (err) {
        alert('Falha ao excluir o inventário.');
      }
    }
  };
  
  const renderFieldComOutros = (label, dados, outros) => {
    let displayValue = 'Não preenchido';
    let allData = [];
    if (dados && dados.length > 0) allData = [...dados];
    const outrosIndex = allData.indexOf('Outros');
    if (outrosIndex !== -1 && outros) {
      allData[outrosIndex] = `Outros: ${outros}`;
    } else if (outrosIndex !== -1) {
      allData.splice(outrosIndex, 1);
    }
    if (allData.length > 0) displayValue = allData.join('; ');
    return ( <div className="display-field"><span className="display-label">{label}:</span><span className="display-value">{displayValue}</span></div> );
  };

  const renderField = (label, value) => {
    let displayValue = value || 'Não preenchido';
    if (Array.isArray(value)) {
      displayValue = value.length > 0 ? value.join('; ') : 'Não preenchido';
    }
    return ( <div className="display-field"><span className="display-label">{label}:</span><span className="display-value">{displayValue}</span></div> );
  };
  
  const renderInfoTooltip = (fieldId, content) => (
    content ? ( <> <span className="info-icon" data-tooltip-id={`tooltip-${fieldId}`} data-tooltip-content={content} data-tooltip-place="right">?</span><Tooltip id={`tooltip-${fieldId}`} /> </> ) : null
  );

  if (loading) {
    return <div className="loading-container">Carregando seu inventário...</div>;
  }

  // TELA DE VISUALIZAÇÃO (READ-ONLY)
  if (!isEditing) {
    return (
      <div className="display-container">
        <div className="inventario-content-wrapper">
          <div className="display-header">
            <h2>Seu Inventário de Dados Pessoais</h2>
            <p>Estes são os dados que você cadastrou. Para modificá-los, clique em "Alterar".</p>
          </div>
          <div className="display-grid">
            {renderField("Nome do Serviço/Processo", dadosDoInventario.nome_servico)}
            {renderField("Sigla", dadosDoInventario.sigla_servico)}
            {renderField("Diretoria", dadosDoInventario.diretoria)}
            {renderField("Resumo da Atividade", dadosDoInventario.resumo_atividade)}
            {renderField("Finalidade", dadosDoInventario.finalidade)}
            {renderField("Base Legal", dadosDoInventario.hipotese_tratamento)}
            {renderFieldComOutros("Dados Pessoais Comuns", dadosDoInventario.dados_pessoais_comuns, dadosDoInventario.outros_dados_comuns)}
            {renderFieldComOutros("Dados Pessoais Sensíveis", dadosDoInventario.dados_pessoais_sensiveis, dadosDoInventario.outros_dados_sensiveis)}
            {renderFieldComOutros("Fonte de Coleta / Categoria dos Titulares", dadosDoInventario.categorias_titulares, dadosDoInventario.outros_categorias_titulares)}
            {renderField("Período de Retenção", dadosDoInventario.periodo_retencao)}
            {renderField("Forma de Eliminação", dadosDoInventario.forma_eliminacao)}
          </div>
          <div className="display-actions">
            <button className="btn-alterar" onClick={() => setIsEditing(true)}>
              <span role="img" aria-label="Editar">✏️</span> Alterar Dados
            </button>
            <button className="btn-excluir" onClick={handleDelete}>
              <span role="img" aria-label="Excluir">🗑️</span> Excluir Inventário
            </button>
          </div>
        </div>
      </div>
    );
  }

  // TELA DE FORMULÁRIO (EDIÇÃO/CRIAÇÃO)
  return (
    <div className="page-container-inventario">
      <div className="inventario-content-wrapper">
        <header className="inventario-header">
          <h2>{dadosDoInventario ? 'Editar' : 'Preencher'} Inventário de Dados Pessoais</h2>
          <p>Preencha ou atualize as informações da atividade de tratamento sob sua responsabilidade.</p>
          {erro && <p className="message error">{erro}</p>}
          {sucesso && <p className="message success">{sucesso}</p>}
        </header>

        <form onSubmit={handleSubmit} className="inventario-form">
          <fieldset>
            <legend>Informações do Serviço/Processo</legend>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="nome_servico">Nome do Serviço/Processo{renderInfoTooltip('nome_servico', formFieldComments.nome_servico)}</label>
                <input id="nome_servico" name="nome_servico" value={formData.nome_servico || ''} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="sigla_servico">Sigla{renderInfoTooltip('sigla_servico', formFieldComments.sigla_servico)}</label>
                <input id="sigla_servico" name="sigla_servico" value={formData.sigla_servico || ''} onChange={handleChange} />
              </div>
              <div className="form-group full-width">
                <label htmlFor="resumo_atividade">Resumo da Atividade{renderInfoTooltip('resumo_atividade', formFieldComments.resumo_atividade)}</label>
                <textarea id="resumo_atividade" name="resumo_atividade" value={formData.resumo_atividade || ''} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label htmlFor="diretoria">Diretoria{renderInfoTooltip('diretoria', formFieldComments.diretoria)}</label>
                <select id="diretoria" name="diretoria" value={formData.diretoria || ''} onChange={handleChange} required>
                  <option value="">Selecione...</option>
                  {optionsDiretoria.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="setor_responsavel">Setor Responsável{renderInfoTooltip('setor_responsavel', formFieldComments.setor_responsavel)}</label>
                <input id="setor_responsavel" name="setor_responsavel" value={formData.setor_responsavel || ''} onChange={handleChange} required />
              </div>
            </div>
          </fieldset>

          <fieldset>
            <legend>Agentes de Tratamento</legend>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="controlador">Controlador{renderInfoTooltip('controlador', formFieldComments.controlador)}</label>
                <input id="controlador" name="controlador" value={formData.controlador || ''} onChange={handleChange} readOnly />
              </div>
              <div className="form-group">
                <label htmlFor="co_controlador">Co-Controlador{renderInfoTooltip('co_controlador', formFieldComments.co_controlador)}</label>
                <input id="co_controlador" name="co_controlador" value={formData.co_controlador || ''} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label htmlFor="operador">Operador{renderInfoTooltip('operador', formFieldComments.operador)}</label>
                <input id="operador" name="operador" value={formData.operador || ''} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label htmlFor="canal_titular">Canal do Titular{renderInfoTooltip('canal_titular', formFieldComments.canal_titular)}</label>
                <div className="input-with-icon">
                  <input id="canal_titular" name="canal_titular" value={formData.canal_titular || ''} readOnly className="locked-input" />
                  <FaLock className="input-icon" />
                </div>
              </div>
            </div>
          </fieldset>
          
          <fieldset>
            <legend>Dados e Finalidade do Tratamento</legend>
            <div className="form-grid">
              <div className="checkbox-section">
                <label>Dados Pessoais Comuns{renderInfoTooltip('dados_pessoais_comuns_section', formFieldComments.dados_pessoais_comuns)}</label>
                <div className="checkbox-grid">
                  {optionsDadosComuns.map(opt => (
                    <div key={opt} className="checkbox-item">
                      <input type="checkbox" id={`dpc_${opt}`} name="dados_pessoais_comuns" value={opt} checked={formData.dados_pessoais_comuns.includes(opt)} onChange={handleChange} />
                      <label htmlFor={`dpc_${opt}`}>{opt}</label>
                    </div>
                  ))}
                </div>
                {formData.dados_pessoais_comuns.includes('Outros') && (
                  <div className="form-group full-width conditional-field">
                    <label htmlFor="outros_dados_comuns">Especifique quais são os "Outros" dados comuns{renderInfoTooltip('outros_dados_comuns', formFieldComments.outros_dados_comuns)}</label>
                    <textarea id="outros_dados_comuns" name="outros_dados_comuns" value={formData.outros_dados_comuns || ''} onChange={handleChange} placeholder="Ex: Nome da mãe, Tipo sanguíneo, etc." required />
                  </div>
                )}
              </div>
              <div className="checkbox-section">
                <label>Dados Pessoais Sensíveis{renderInfoTooltip('dados_pessoais_sensiveis_section', formFieldComments.dados_pessoais_sensiveis)}</label>
                <div className="checkbox-grid">
                  {optionsDadosSensiveis.map(opt => (
                    <div key={opt} className="checkbox-item">
                      <input type="checkbox" id={`dps_${opt}`} name="dados_pessoais_sensiveis" value={opt} checked={formData.dados_pessoais_sensiveis.includes(opt)} onChange={handleChange} />
                      <label htmlFor={`dps_${opt}`}>{opt}</label>
                    </div>
                  ))}
                </div>
                {formData.dados_pessoais_sensiveis.includes('Outros') && (
                  <div className="form-group full-width conditional-field">
                    <label htmlFor="outros_dados_sensiveis">Especifique quais são os "Outros" dados sensíveis{renderInfoTooltip('outros_dados_sensiveis', formFieldComments.outros_dados_sensiveis)}</label>
                    <textarea id="outros_dados_sensiveis" name="outros_dados_sensiveis" value={formData.outros_dados_sensiveis || ''} onChange={handleChange} placeholder="Especifique o dado sensível coletado" required />
                  </div>
                )}
              </div>
              <div className="checkbox-section">
                <label>Fonte de Coleta / Categoria dos Titulares{renderInfoTooltip('categorias_titulares_section', formFieldComments.categorias_titulares)}</label>
                <div className="checkbox-grid">
                  {optionsCategoriasTitulares.map(opt => (
                    <div key={opt} className="checkbox-item">
                      <input type="checkbox" id={`cat_${opt}`} name="categorias_titulares" value={opt} checked={formData.categorias_titulares.includes(opt)} onChange={handleChange} />
                      <label htmlFor={`cat_${opt}`}>{opt}</label>
                    </div>
                  ))}
                </div>
                {formData.categorias_titulares.includes('Outros') && (
                  <div className="form-group full-width conditional-field">
                    <label htmlFor="outros_categorias_titulares">Especifique a outra Fonte de Coleta / Categoria dos Titulares{renderInfoTooltip('outros_categorias_titulares', formFieldComments.outros_categorias_titulares)}</label>
                    <textarea id="outros_categorias_titulares" name="outros_categorias_titulares" value={formData.outros_categorias_titulares || ''} onChange={handleChange} placeholder="Especifique a fonte ou categoria" required />
                  </div>
                )}
              </div>
              <div className="form-group full-width">
                <label htmlFor="finalidade">Finalidade do Tratamento{renderInfoTooltip('finalidade', formFieldComments.finalidade)}</label>
                <textarea id="finalidade" name="finalidade" value={formData.finalidade || ''} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label htmlFor="hipotese_tratamento">Hipótese de Tratamento (Base Legal){renderInfoTooltip('hipotese_tratamento', formFieldComments.hipotese_tratamento)}</label>
                <select id="hipotese_tratamento" name="hipotese_tratamento" value={formData.hipotese_tratamento || ''} onChange={handleChange} required>
                  <option value="">Selecione...</option>
                  {optionsHipoteseTratamento.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div className="checkbox-section full-width">
                 <label>Princípios da LGPD Atendidos{renderInfoTooltip('principios_lgpd_section', formFieldComments.principios_lgpd)}</label>
                 <div className="checkbox-grid">
                   {optionsPrincipiosLGPD.map(opt => (
                     <div key={opt} className="checkbox-item">
                       <input type="checkbox" id={`principio_${opt}`} name="principios_lgpd" value={opt} checked={formData.principios_lgpd.includes(opt)} onChange={handleChange} />
                       <label htmlFor={`principio_${opt}`}>{opt}</label>
                     </div>
                   ))}
                 </div>
               </div>
            </div>
          </fieldset>

          <fieldset>
            <legend>Compartilhamento e Transferência de Dados</legend>
            <div className="form-grid">
              <div className="checkbox-section">
                <label>Compartilhamento dos Dados{renderInfoTooltip('compartilhamento_detalhes_section', formFieldComments.compartilhamento_detalhes)}</label>
                <div className="checkbox-grid">
                  {optionsCompartilhamento.map(opt => (
                    <div key={opt} className="checkbox-item">
                      <input type="checkbox" id={`comp_${opt}`} name="compartilhamento_detalhes" value={opt} checked={formData.compartilhamento_detalhes.includes(opt)} onChange={handleChange} />
                      <label htmlFor={`comp_${opt}`}>{opt}</label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="form-group full-width">
                <label htmlFor="finalidade_compartilhamento">Finalidade do Compartilhamento{renderInfoTooltip('finalidade_compartilhamento', formFieldComments.finalidade_compartilhamento)}</label>
                <textarea id="finalidade_compartilhamento" name="finalidade_compartilhamento" value={formData.finalidade_compartilhamento || ''} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label htmlFor="transferencia_internacional">Transferência Internacional{renderInfoTooltip('transferencia_internacional', formFieldComments.transferencia_internacional)}</label>
                <select id="transferencia_internacional" name="transferencia_internacional" value={formData.transferencia_internacional || ''} onChange={handleChange}>
                  <option value="">Selecione...</option>
                  {optionsTransferencia.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              {formData.transferencia_internacional !== 'Não se aplica' && (
                <>
                  <div className="form-group">
                    <label htmlFor="paises_transferencia">País(es) de Destino{renderInfoTooltip('paises_transferencia', formFieldComments.paises_transferencia)}</label>
                    <input id="paises_transferencia" name="paises_transferencia" value={formData.paises_transferencia || ''} onChange={handleChange} />
                  </div>
                  <div className="form-group full-width">
                    <label htmlFor="garantias_transferencia">Garantias para a Transferência{renderInfoTooltip('garantias_transferencia', formFieldComments.garantias_transferencia)}</label>
                    <input id="garantias_transferencia" name="garantias_transferencia" value={formData.garantias_transferencia || ''} onChange={handleChange} />
                  </div>
                </>
              )}
            </div>
          </fieldset>

          <fieldset>
            <legend>Retenção, Eliminação e Segurança</legend>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="periodo_retencao">Período de Retenção Do Dado Pessoal{renderInfoTooltip('periodo_retencao', formFieldComments.periodo_retencao)}</label>
                <input id="periodo_retencao" name="periodo_retencao" value={formData.periodo_retencao || ''} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label htmlFor="forma_eliminacao">Forma de Eliminação do Dado Pessoal{renderInfoTooltip('forma_eliminacao', formFieldComments.forma_eliminacao)}</label>
                <select id="forma_eliminacao" name="forma_eliminacao" value={formData.forma_eliminacao || ''} onChange={handleChange} required>
                  <option value="">Selecione...</option>
                  <option value="Anonimizado">Anonimizado</option>
                  <option value="Excluido">Excluído</option>
                </select>
              </div>
              <div className="checkbox-section full-width">
                <label>Medidas de Segurança{renderInfoTooltip('medidas_seguranca_section', formFieldComments.medidas_seguranca)}</label>
                <div className="checkbox-grid">
                  {optionsMedidasSeguranca.map(opt => (
                    <div key={opt} className="checkbox-item">
                      <input type="checkbox" id={`seg_${opt}`} name="medidas_seguranca" value={opt} checked={formData.medidas_seguranca.includes(opt)} onChange={handleChange} />
                      <label htmlFor={`seg_${opt}`}>{opt}</label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </fieldset>

          <div className="form-actions">
            <button type="submit" className="btn-salvar" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Inventário'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

