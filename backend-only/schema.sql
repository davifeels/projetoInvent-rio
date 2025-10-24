-- Define configurações de codificação e fuso horário para compatibilidade
SET NAMES utf8mb4;
SET time_zone = '+00:00';
SET foreign_key_checks = 0;
SET sql_mode = 'NO_AUTO_VALUE_ON_ZERO';

-- Tabela para Setores
DROP TABLE IF EXISTS `setores`;
CREATE TABLE `setores` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) NOT NULL,
  `sigla` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sigla` (`sigla`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Tabela para Funções
DROP TABLE IF EXISTS `funcoes`;
CREATE TABLE `funcoes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Tabela para Usuários
DROP TABLE IF EXISTS `usuarios`;
CREATE TABLE `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `senha_hash` varchar(255) NOT NULL,
  `perfil_id` int NOT NULL COMMENT '1: Master, 2: Coordenador, 3: Usuário',
  `status` enum('ativo','pendente','inativo','rejeitado', 'ativo_inventario_pendente') NOT NULL DEFAULT 'pendente',
  `setor_id` int DEFAULT NULL,
  `funcao_id` int DEFAULT NULL,
  `data_criacao` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `setor_id` (`setor_id`),
  KEY `funcao_id` (`funcao_id`),
  CONSTRAINT `usuarios_ibfk_1` FOREIGN KEY (`setor_id`) REFERENCES `setores` (`id`) ON DELETE SET NULL,
  CONSTRAINT `usuarios_ibfk_2` FOREIGN KEY (`funcao_id`) REFERENCES `funcoes` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Tabela para Auditoria
DROP TABLE IF EXISTS `auditoria`;
CREATE TABLE `auditoria` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int DEFAULT NULL,
  `acao` varchar(255) NOT NULL,
  `setor_id` int DEFAULT NULL,
  `detalhes` json DEFAULT NULL,
  `data_acao` timestamp(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `auditoria_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Tabela para o Inventário LGPD (pessoal)
DROP TABLE IF EXISTS `inventario_lgpd`;
CREATE TABLE `inventario_lgpd` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `nome_servico` varchar(255) DEFAULT NULL,
  `sigla_servico` varchar(50) DEFAULT NULL,
  `resumo_atividade` text,
  `diretoria` varchar(255) DEFAULT NULL,
  `setor_responsavel` varchar(255) DEFAULT NULL,
  `controlador` varchar(255) DEFAULT 'ITI',
  `co_controlador` varchar(255) DEFAULT NULL,
  `operador` varchar(255) DEFAULT NULL,
  `canal_titular` varchar(255) DEFAULT 'privacidade@iti.gov.br',
  `dados_pessoais_comuns` json,
  `outros_dados_comuns` text,
  `dados_pessoais_sensiveis` json,
  `outros_dados_sensiveis` text,
  `categorias_titulares` json,
  `outros_categorias_titulares` text,
  `finalidade` text,
  `hipotese_tratamento` varchar(255) DEFAULT NULL,
  `principios_lgpd` json,
  `compartilhamento_detalhes` json,
  `finalidade_compartilhamento` text,
  `transferencia_internacional` varchar(255) DEFAULT 'Não se aplica',
  `paises_transferencia` varchar(255) DEFAULT NULL,
  `garantias_transferencia` text,
  `medidas_seguranca` json,
  `periodo_retencao` varchar(255) DEFAULT NULL,
  `forma_eliminacao` varchar(255) DEFAULT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `inventario_lgpd_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

