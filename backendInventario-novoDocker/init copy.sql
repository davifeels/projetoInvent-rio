-- Criação do banco de dados
CREATE DATABASE IF NOT EXISTS cadastro_colaboradores;
USE cadastro_colaboradores;

-- Tabela de Setores
CREATE TABLE IF NOT EXISTS setores (
  id INT NOT NULL AUTO_INCREMENT,
  nome VARCHAR(255) NOT NULL,
  sigla VARCHAR(10) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY sigla_UNIQUE (sigla)
) ENGINE=InnoDB;

-- Tabela de Funções
CREATE TABLE IF NOT EXISTS funcoes (
  id INT NOT NULL AUTO_INCREMENT,
  nome VARCHAR(255) NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB;

-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS usuarios (
  id INT NOT NULL AUTO_INCREMENT,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  perfil_id INT NOT NULL COMMENT '1: Master, 2: Coordenador, 3: Usuário',
  tipo_usuario VARCHAR(50) NOT NULL,
  setor_id INT NULL,
  funcao_id INT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'ativo',
  data_criacao TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY email_UNIQUE (email),
  KEY fk_usuarios_setor_idx (setor_id),
  KEY fk_usuarios_funcao_idx (funcao_id),
  CONSTRAINT fk_usuarios_setor FOREIGN KEY (setor_id) REFERENCES setores (id) ON DELETE SET NULL,
  CONSTRAINT fk_usuarios_funcao FOREIGN KEY (funcao_id) REFERENCES funcoes (id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Tabela para Solicitações de Cadastro
CREATE TABLE IF NOT EXISTS cadastros (
  id INT NOT NULL AUTO_INCREMENT,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  tipo_usuario_solicitado VARCHAR(50) NOT NULL,
  perfil_id_solicitado INT NOT NULL,
  setor_id INT NOT NULL,
  funcao_id INT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pendente',
  usuario_id_solicitante INT NOT NULL,
  aprovado_por_usuario_id INT NULL,
  rejeitado_por_usuario_id INT NULL,
  usuario_criado_id INT NULL,
  data_solicitacao TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  data_aprovacao TIMESTAMP NULL,
  data_rejeicao TIMESTAMP NULL,
  PRIMARY KEY (id),
  KEY fk_cadastros_usuario_solicitante_idx (usuario_id_solicitante),
  CONSTRAINT fk_cadastros_usuario_solicitante FOREIGN KEY (usuario_id_solicitante) REFERENCES usuarios (id)
) ENGINE=InnoDB;

-- Tabela de Auditoria
CREATE TABLE IF NOT EXISTS auditoria (
  id INT NOT NULL AUTO_INCREMENT,
  usuario_id INT NULL,
  acao VARCHAR(255) NOT NULL,
  setor_id INT NULL,
  detalhes TEXT NULL,
  data_acao TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY fk_auditoria_usuario_idx (usuario_id),
  CONSTRAINT fk_auditoria_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Tabela do Inventário LGPD
CREATE TABLE IF NOT EXISTS inventario_lgpd (
  id INT NOT NULL AUTO_INCREMENT,
  usuario_id INT NOT NULL,
  nome_servico VARCHAR(255) NULL,
  sigla_servico VARCHAR(50) NULL,
  resumo_atividade TEXT NULL,
  diretoria VARCHAR(255) NULL,
  setor_responsavel VARCHAR(255) NULL,
  controlador VARCHAR(255) DEFAULT 'ITI',
  co_controlador VARCHAR(255) NULL,
  operador VARCHAR(255) NULL,
  canal_titular VARCHAR(255) DEFAULT 'privacidade@iti.gov.br',
  dados_pessoais_comuns TEXT NULL,
  dados_pessoais_sensiveis TEXT NULL,
  categorias_titulares TEXT NULL,
  finalidade TEXT NULL,
  hipotese_tratamento VARCHAR(255) NULL,
  principios_lgpd TEXT NULL,
  compartilhamento_detalhes TEXT NULL,
  finalidade_compartilhamento TEXT NULL,
  transferencia_internacional VARCHAR(255) DEFAULT 'Não se aplica',
  paises_transferencia VARCHAR(255) NULL,
  garantias_transferencia VARCHAR(255) NULL,
  medidas_seguranca TEXT NULL,
  periodo_retencao VARCHAR(255) NULL,
  forma_eliminacao VARCHAR(255) NULL,
  data_insercao TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY usuario_id_UNIQUE (usuario_id),
  CONSTRAINT fk_inventario_lgpd_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Tabela de Inventário Geral (separado do LGPD)
CREATE TABLE IF NOT EXISTS inventario_dados (
  id INT NOT NULL AUTO_INCREMENT,
  usuario_id INT,
  numero VARCHAR(255),
  nome_servico VARCHAR(255),
  sigla_servico VARCHAR(50),
  resumo_atividade TEXT,
  diretoria VARCHAR(255),
  data_insercao DATE,
  data_atualizacao DATE,
  controlador VARCHAR(255),
  co_controlador VARCHAR(255),
  operador VARCHAR(255),
  canal_titular VARCHAR(255),
  tipo_dado VARCHAR(255),
  finalidade VARCHAR(255),
  base_legal VARCHAR(255),
  compartilhado_com_terceiros BOOLEAN,
  tempo_retencao VARCHAR(255),
  medidas_seguranca VARCHAR(255),
  PRIMARY KEY (id)
) ENGINE=InnoDB;


INSERT INTO setores (nome, sigla) VALUES ('Administração Master', 'MASTER') ON DUPLICATE KEY UPDATE sigla=sigla;

INSERT INTO funcoes (nome) VALUES ('Administrador do Sistema') ON DUPLICATE KEY UPDATE nome=nome;

INSERT INTO usuarios (nome, email, senha_hash, perfil_id, tipo_usuario, setor_id, funcao_id, status)
VALUES (
    'Admin Master',
    'admin@iti.gov.br',
    '$2a$10$3Z4yY.q1oF8oG1r.Z6v8n.pD9H/2J2e.s3sK7cM4C2.t6G0g7H6O6', -- Senha: 'admin123'
    1,
    'MASTER',
    (SELECT id FROM setores WHERE sigla = 'MASTER'),
    (SELECT id FROM funcoes WHERE nome = 'Administrador do Sistema'),
    'ativo'
);
