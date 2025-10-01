-- Configurar encoding UTF-8
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- Criação do banco de dados
CREATE DATABASE IF NOT EXISTS `cadastro_colaboradores`;
USE `cadastro_colaboradores`;

-- Tabela de Perfis de Acesso
CREATE TABLE IF NOT EXISTS `perfis` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(50) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

-- Tabela de Setores
CREATE TABLE IF NOT EXISTS `setores` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(100) NOT NULL,
  `sigla` VARCHAR(20) NOT NULL UNIQUE,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

-- Tabela de Funções
CREATE TABLE IF NOT EXISTS `funcoes` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(100) NOT NULL UNIQUE,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `senha_hash` VARCHAR(255) NOT NULL,
  `perfil_id` INT,
  `setor_id` INT,
  `funcao_id` INT,
  `status` VARCHAR(20) NOT NULL DEFAULT 'ativo' COMMENT 'Valores: ativo, pendente, inativo, rejeitado, ativo_inventario_pendente',
  `tipo_usuario` ENUM('USUARIO','COORDENADOR') NOT NULL DEFAULT 'USUARIO',
  `data_criacao` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`perfil_id`) REFERENCES `perfis`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`setor_id`) REFERENCES `setores`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`funcao_id`) REFERENCES `funcoes`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Tabela de Solicitações de Cadastro
CREATE TABLE IF NOT EXISTS `cadastros` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `senha_hash` VARCHAR(255) NOT NULL,
  `tipo_usuario_solicitado` VARCHAR(50) NOT NULL,
  `perfil_id_solicitado` INT NOT NULL,
  `setor_id` INT NOT NULL,
  `funcao_id` INT NOT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'pendente' COMMENT 'Valores: pendente, aprovado, rejeitado',
  `usuario_id_solicitante` INT,
  `aprovado_por_usuario_id` INT NULL,
  `rejeitado_por_usuario_id` INT NULL,
  `usuario_criado_id` INT NULL,
  `data_solicitacao` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `data_aprovacao` TIMESTAMP NULL,
  `data_rejeicao` TIMESTAMP NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`usuario_id_solicitante`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Tabela de Auditoria
CREATE TABLE IF NOT EXISTS `auditoria` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `usuario_id` INT NULL,
  `acao` VARCHAR(255) NOT NULL,
  `setor_id` INT NULL,
  `detalhes` TEXT NULL COMMENT 'Armazena informações adicionais em formato JSON',
  `data_acao` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ✅ CORREÇÃO: Tabela Inventário LGPD com createdAt e updatedAt
CREATE TABLE IF NOT EXISTS `inventario_lgpd` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `usuario_id` INT NOT NULL,
  `nome_servico` VARCHAR(255) NULL,
  `sigla_servico` VARCHAR(50) NULL,
  `resumo_atividade` TEXT NULL,
  `diretoria` VARCHAR(255) NULL,
  `setor_responsavel` VARCHAR(255) NULL,
  `controlador` VARCHAR(255) DEFAULT 'ITI',
  `co_controlador` VARCHAR(255) NULL,
  `operador` VARCHAR(255) NULL,
  `canal_titular` VARCHAR(255) DEFAULT 'privacidade@iti.gov.br',
  `dados_pessoais_comuns` TEXT NULL,
  `outros_dados_comuns` TEXT NULL,
  `dados_pessoais_sensiveis` TEXT NULL,
  `outros_dados_sensiveis` TEXT NULL,
  `categorias_titulares` TEXT NULL,
  `outros_categorias_titulares` TEXT NULL,
  `finalidade` TEXT NULL,
  `hipotese_tratamento` VARCHAR(255) NULL,
  `principios_lgpd` TEXT NULL,
  `compartilhamento_detalhes` TEXT NULL,
  `finalidade_compartilhamento` TEXT NULL,
  `transferencia_internacional` VARCHAR(255) DEFAULT 'Não se aplica',
  `paises_transferencia` VARCHAR(255) NULL,
  `garantias_transferencia` VARCHAR(255) NULL,
  `medidas_seguranca` TEXT NULL,
  `periodo_retencao` VARCHAR(255) NULL,
  `forma_eliminacao` VARCHAR(255) NULL,
  `createdAt` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `usuario_id_UNIQUE` (`usuario_id`),
  CONSTRAINT `fk_inventario_lgpd_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Tabela de Refresh Tokens
CREATE TABLE IF NOT EXISTS `refresh_tokens` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `usuario_id` INT NOT NULL,
  `token` VARCHAR(255) NOT NULL UNIQUE,
  `expiresAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ========================================
-- DADOS INICIAIS (SEEDS)
-- ========================================

-- Perfis
INSERT INTO perfis (id, nome) VALUES
(1, 'Master'),
(2, 'Coordenador'),
(3, 'Usuario')
ON DUPLICATE KEY UPDATE nome = VALUES(nome);

-- Setores (extraídos do documento)
INSERT INTO setores (nome, sigla) VALUES 
('Administração Master', 'MASTER'),
('Gabinete', 'GABIN'),
('Assessoria de Comunicação', 'ASCOM'),
('Coordenação-Geral de Inovação, Cooperação e Projetos', 'CGICP'),
('Auditoria Interna', 'AUDIN'),
('Procuradoria Federal Especializada', 'PFE'),
('Divisão de Assuntos Finalísticos', 'DIAFI'),
('Diretoria de Planejamento, Orçamento e Administração', 'DPOA'),
('Coordenação-Geral de Planejamento, Orçamento e Administração', 'CGPOA'),
('Coordenação de Planejamento e Execução Orçamentária e Financeira', 'COPEO'),
('Coordenação de Licitações e Contratos', 'COLIC'),
('Coordenação de Gestão de Pessoas e Desenvolvimento Institucional', 'COGED'),
('Serviço de Gestão de Pessoas', 'SEGEP'),
('Coordenação Geral de Tecnologia da Informação e Comunicação', 'CGTIC'),
('Coordenação de Tecnologia da Informação e Comunicações', 'COTIC'),
('Divisão de Recursos Logísticos', 'DILOG'),
('Serviço de Logística Administrativa', 'SELOG'),
('Serviço de Contabilidade', 'SECON'),
('Diretoria de Infraestrutura Tecnológica', 'DITEC'),
('Coordenação-Geral de Infraestrutura e Segurança', 'CGISE'),
('Coordenação de Infraestrutura Tecnológica', 'COTEC'),
('Coordenação de Segurança', 'COSEG'),
('Coordenação-Geral de Operações', 'CGOPE'),
('Coordenação de Operação de Chaves Públicas', 'COICP'),
('Coordenação de Serviços Tecnológicos', 'CSERV'),
('Serviço de Operação da Entidade de Auditoria do Tempo', 'SETEM'),
('Diretoria de Auditoria, Fiscalização e Normalização', 'DAFN'),
('Coordenação-Geral de Auditoria e Fiscalização', 'CGAFI'),
('Coordenação de Auditoria e Credenciamento', 'COAUC'),
('Coordenação de Fiscalização e Combate a Fraude', 'COFIC'),
('Coordenação de Inteligência e Análise Preditiva', 'COIAP'),
('Coordenação-Geral de Normalização e Pesquisa', 'CGNPE'),
('Divisão de Normalização', 'DINOR'),
('Diretoria de Tecnologias de Identificação', 'DITI'),
('Protocolo', 'PROTO')
ON DUPLICATE KEY UPDATE nome = VALUES(nome);

-- Funções (extraídas do documento, sem repetição)
INSERT INTO funcoes (nome) VALUES 
('Administrador do Sistema'),
('Diretor-Presidente'),
('Chefe de Gabinete'),
('Assessor'),
('Apoio Especializado em Gestão'),
('Assistente Técnico em Serviço Público'),
('Chefe de Assessoria'),
('Apoio Especializado em Gestão de TI'),
('Coordenador-Geral'),
('Coordenador de Cooperação e Projetos'),
('Servidor'),
('Servidora'),
('Estagiário'),
('Estagiária'),
('Coordenador'),
('Procurador-Chefe'),
('Procurador Federal'),
('Chefe de Divisão'),
('Diretora'),
('Coordenadora-Geral'),
('Assistente Técnico'),
('Coordenador'),
('Assistente Técnico no Serviço Público'),
('Coordenadora'),
('Chefe de Serviço'),
('Engenheiro'),
('Analista em Tecnologia da Informação'),
('Administrador de Redes'),
('Apoio Especializado em Gestão de Tecnologia da Informação'),
('Analista de TI'),
('Coordenador de Suporte'),
('Técnico de Suporte'),
('Apoio Especializado'),
('Chefe de Serviço – Substituto'),
('Diretor'),
('Apoio Administrativo'),
('Startup Temporário'),
('Apoio Especializado em Tecnologia da Informação'),
('Apoio Especializado em Segurança da Informação'),
('Coordenador'),
('Analista de Sistemas'),
('Engenheiro de Telecomunicações'),
('Coordenadora-Geral de Tecnologias de Identificação'),
('Coordenador-Geral de Articulação Interfederativa'),
('Assessora'),
('Administrativo'),
('Recepcionista'),
('Agente de Limpeza'),
('Auditor')
ON DUPLICATE KEY UPDATE nome = VALUES(nome);

-- ✅ USUÁRIO MASTER COM HASH CORRETO
-- Execute: node gerarHash.js para gerar um novo hash
-- Este hash é de exemplo: '$2a$12$sMMk062yjzZc2jvs/h75UOVJNc64NKDvsC9kTjeWjg2m/ZOnk6YYe'
INSERT INTO usuarios (nome, email, senha_hash, perfil_id, tipo_usuario, setor_id, funcao_id, status)
VALUES (
    'Administrador Master',
    'admin@iti.gov.br',
    '$2a$12$sMMk062yjzZc2jvs/h75UOVJNc64NKDvsC9kTjeWjg2m/ZOnk6YYe',
    1,
    'COORDENADOR',
    (SELECT id FROM setores WHERE sigla = 'MASTER'),
    (SELECT id FROM funcoes WHERE nome = 'Administrador do Sistema'),
    'ativo'
)
ON DUPLICATE KEY UPDATE nome = VALUES(nome);