import React from 'react';
import BackButton from '../components/BackButton';
import './MeuInventarioDisplay.css';

export default function MeuInventarioDisplay({ inventario, onEditClick, onDeleteClick }) {
  
  const renderField = (label, value) => (
    <div className="display-field">
      <span className="display-label">{label}</span>
      <span className="display-value">{value || <span className="not-filled">Não preenchido</span>}</span>
    </div>
  );

  const renderArrayAsTags = (label, array) => {
    const items = Array.isArray(array) ? array : [];
    
    return (
      <div className="display-field">
        <span className="display-label">{label}</span>
        <div className="tag-container">
          {items.length > 0 ? (
            items.map((item, index) => <span key={index} className="tag">{item}</span>)
          ) : (
            <span className="not-filled">Nenhum item selecionado</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="display-container-wrapper">
      <BackButton />
      
      <div className="display-container">
        <div className="display-header">
          <h2>Seu Inventário de Dados Pessoais</h2>
          <p>Estes são os dados que você cadastrou. Para modificá-los ou excluí-los, use os botões abaixo.</p>
        </div>
        
        <div className="display-content">
          {/* Seção de Identificação */}
          <section className="display-section">
            <h3 className="section-title">Identificação do Processo</h3>
            {renderField("Nome do Serviço/Processo", inventario.nome_servico)}
            {renderField("Sigla", inventario.sigla_servico)}
            {renderField("Diretoria Responsável", inventario.diretoria)}
            {renderField("Resumo da Atividade", inventario.resumo_atividade)}
          </section>
          
          {/* Seção de Detalhes do Tratamento */}
          <section className="display-section">
            <h3 className="section-title">Detalhes do Tratamento</h3>
            {renderField("Controlador", inventario.controlador)}
            {renderField("Operador", inventario.operador)}
            {renderField("Finalidade", inventario.finalidade)}
            {renderField("Hipótese de Tratamento (Base Legal)", inventario.hipotese_tratamento)}
            {renderArrayAsTags("Dados Pessoais Comuns Coletados", inventario.dados_pessoais_comuns)}
            {renderArrayAsTags("Dados Pessoais Sensíveis Coletados", inventario.dados_pessoais_sensiveis)}
          </section>

          {/* Seção de Segurança e Retenção */}
          <section className="display-section">
            <h3 className="section-title">Segurança e Retenção</h3>
            {renderField("Período de Retenção", inventario.periodo_retencao)}
            {renderField("Forma de Eliminação", inventario.forma_eliminacao)}
            {renderArrayAsTags("Medidas de Segurança Aplicadas", inventario.medidas_seguranca)}
          </section>
        </div>

        <div className="display-actions">
          <button className="btn-delete-inv" onClick={onDeleteClick}>
            Excluir Inventário
          </button>
          <button className="btn-edit-inv" onClick={onEditClick}>
            Alterar Dados
          </button>
        </div>
      </div>
    </div>
  );
}