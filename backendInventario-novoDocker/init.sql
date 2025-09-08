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

-- Tabela Inventário LGPD
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
  `data_insercao` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `data_atualizacao` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
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

-- Dados iniciais (Seeds)
INSERT INTO perfis (id, nome) VALUES
(1, 'Master'),
(2, 'Coordenador'),
(3, 'Usuario')
ON DUPLICATE KEY UPDATE nome = VALUES(nome);

INSERT INTO setores (nome, sigla) VALUES ('Administração Master', 'MASTER')
ON DUPLICATE KEY UPDATE nome = VALUES(nome);

INSERT INTO funcoes (nome) VALUES ('Administrador do Sistema')
ON DUPLICATE KEY UPDATE nome = VALUES(nome);

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