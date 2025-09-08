import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios'; // ✅ Caminho ajustado corretamente (src/pages → src/api)
import './cadastroinventario.css'; // ✅ Estilo localizado em src/pages

export default function CadastroInventario() {
  const [formData, setFormData] = useState({
    resumoAtividade: '',
    diretoria: '',
    setorResponsavel: '',
    controlador: '',
    coControlador: '',
    operador: '',
    email: '',
    tipoDado: '',
    finalidade: '',
    baseLegal: '',
    tempoRetencao: '',
    medidasSeguranca: '',
  });
  
  const [status, setStatus] = useState({ erro: '', sucesso: '' });
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setStatus({ erro: '', sucesso: '' });

    try {
      const payload = {
        resumo_atividade: formData.resumoAtividade,
        diretoria: formData.diretoria,
        setor_responsavel: formData.setorResponsavel,
        controlador: formData.controlador,
        co_controlador: formData.coControlador,
        operador: formData.operador,
        canal_titular: formData.email,
        tipo_dado: formData.tipoDado,
        finalidade: formData.finalidade,
        base_legal: formData.baseLegal,
        tempo_retencao: formData.tempoRetencao,
        medidas_seguranca: formData.medidasSeguranca,
        nome_servico: 'Serviço Automático via Formulário',
        sigla_servico: 'FORM',
      };

      await api.post('/inventario', payload);
      setStatus({ erro: '', sucesso: 'Inventário cadastrado com sucesso!' });
      
      setFormData({
        resumoAtividade: '', diretoria: '', setorResponsavel: '', controlador: '',
        coControlador: '', operador: '', email: '', tipoDado: '', finalidade: '',
        baseLegal: '', tempoRetencao: '', medidasSeguranca: ''
      });
      setTimeout(() => navigate('/inventario'), 2000);

    } catch (error) {
      setStatus({ sucesso: '', erro: error.response?.data?.message || 'Erro ao cadastrar inventário. Tente novamente.' });
    }
  }, [formData, navigate]);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Cadastro de Inventário de Dados</h1>
      </div>
      
      {status.erro && <p className="feedback-message error">{status.erro}</p>}
      {status.sucesso && <p className="feedback-message success">{status.sucesso}</p>}

      <form onSubmit={handleSubmit} className="inventario-form">
        <div className="form-group full-width">
          <label htmlFor="resumoAtividade">Atividade (Resumo)*</label>
          <textarea
            id="resumoAtividade"
            name="resumoAtividade"
            value={formData.resumoAtividade}
            onChange={handleChange}
            placeholder="Descreva a atividade de tratamento de dados. Ex: Gestão de folha de pagamento"
            required
            rows="4"
          />
        </div>

        <div className="form-group">
          <label htmlFor="diretoria">Diretoria*</label>
          <input id="diretoria" name="diretoria" type="text" value={formData.diretoria} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label htmlFor="setorResponsavel">Setor Responsável</label>
          <input id="setorResponsavel" name="setorResponsavel" type="text" value={formData.setorResponsavel} onChange={handleChange} />
        </div>
        
        <div className="form-group">
          <label htmlFor="controlador">Controlador</label>
          <input id="controlador" name="controlador" type="text" value={formData.controlador} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label htmlFor="coControlador">Co-controlador</label>
          <input id="coControlador" name="coControlador" type="text" value={formData.coControlador} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label htmlFor="operador">Operador</label>
          <input id="operador" name="operador" type="text" value={formData.operador} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label htmlFor="email">E-mail (Canal do Titular)</label>
          <input id="email" name="email" type="email" value={formData.email} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label htmlFor="tipoDado">Tipo de Dado</label>
          <input id="tipoDado" name="tipoDado" type="text" value={formData.tipoDado} onChange={handleChange} placeholder="Ex: Dados cadastrais, financeiros..."/>
        </div>

        <div className="form-group">
          <label htmlFor="finalidade">Finalidade</label>
          <input id="finalidade" name="finalidade" type="text" value={formData.finalidade} onChange={handleChange} placeholder="Ex: Cumprir obrigações contratuais" />
        </div>
        
        <div className="form-group">
          <label htmlFor="baseLegal">Base Legal</label>
          <input id="baseLegal" name="baseLegal" type="text" value={formData.baseLegal} onChange={handleChange} placeholder="Ex: Consentimento, Contrato, Legítimo Interesse..." />
        </div>
        
        <div className="form-group">
          <label htmlFor="tempoRetencao">Tempo de Retenção</label>
          <input id="tempoRetencao" name="tempoRetencao" type="text" value={formData.tempoRetencao} onChange={handleChange} placeholder="Ex: 5 anos após o término do contrato"/>
        </div>

        <div className="form-group full-width">
          <label htmlFor="medidasSeguranca">Medidas de Segurança</label>
          <textarea id="medidasSeguranca" name="medidasSeguranca" value={formData.medidasSeguranca} onChange={handleChange} rows="3" placeholder="Ex: Criptografia, controle de acesso..."/>
        </div>

        <div className="form-actions">
          <button type="button" className="btn-cancelar" onClick={() => navigate('/inventario')}>Cancelar</button>
          <button type="submit" className="btn-submit">Cadastrar Inventário</button>
        </div>
      </form>
    </div>
  );
}