Manual Completo de Arquitetura e Implantação: Sistema de Cadastro & Inventário LGPD
1. Visão Geral do Sistema
Bem-vindo ao manual do Sistema de Cadastro & Inventário. Esta é uma aplicação full-stack robusta, projetada para gerir utilizadores, colaboradores e inventários de dados, com um forte foco em segurança, controlo de acesso por perfis e conformidade com a Lei Geral de Proteção de Dados (LGPD).

1.1. Divisão da Aplicação
O sistema é dividido em duas partes principais que se comunicam via uma API RESTful:

Backend (API): Construído com Node.js e Express.js, é o cérebro da aplicação. É responsável por toda a lógica de negócio, interações com o banco de dados, autenticação, autorização e segurança.

Frontend (Cliente Web): Construído com React, fornece uma interface de utilizador moderna, reativa e interativa para consumir os serviços da API, garantindo uma experiência de utilizador fluida.

1.2. Funcionalidades Principais
Gestão de Utilizadores: Ciclo de vida completo de utilizadores, incluindo criação, edição, e exclusão, com diferentes níveis de permissão.

Controlo de Acesso Baseado em Perfis (RBAC): O sistema define três perfis com permissões distintas e granulares:

Master (Administrador): Acesso total e irrestrito a todos os recursos do sistema.

Coordenador: Acesso de gestão limitado aos recursos e utilizadores do seu próprio setor.

Utilizador Comum: Acesso básico, focado no preenchimento e gestão do seu próprio inventário de dados.

Fluxo de Aprovação de Cadastro: Novos utilizadores podem ser solicitados por gestores, passando por um fluxo de aprovação antes de terem o acesso ao sistema efetivado.

Inventário de Tratamento de Dados Pessoais (LGPD): Cada utilizador deve preencher um inventário detalhado sobre as atividades de tratamento de dados sob sua responsabilidade, garantindo a conformidade com a LGPD.

Painel de Controlo LGPD (Visão Master): O administrador (Master) tem acesso a um painel centralizado para visualizar, gerir e exportar todos os inventários LGPD submetidos por todos os utilizadores.

Auditoria Completa: Todas as ações críticas (logins, criação de utilizadores, aprovações, exportações) são registadas numa trilha de auditoria detalhada para rastreabilidade e segurança.

2. Arquitetura Detalhada
2.1. Arquitetura do Backend
O backend segue uma arquitetura modular e orientada a serviços.

Stack Tecnológico:

Runtime: Node.js

Framework: Express.js

Banco de Dados: MySQL, com o driver mysql2 para conexões otimizadas.

Autenticação: JSON Web Tokens (JWT) com a biblioteca jsonwebtoken.

Segurança de Senhas: Hashing de senhas com bcryptjs.

Validação: Validação de schemas de dados com joi para garantir a integridade dos dados de entrada.

Geração de Excel: Relatórios em formato .xlsx gerados com exceljs.

Documentação da API: Geração automática de documentação com swagger-jsdoc e swagger-ui-express.

Estrutura de Ficheiros:

/backend
|-- /config       # Configuração da base de dados (db.js)
|-- /controllers  # Lógica de negócio (authController.js, usuarioController.js, etc.)
|-- /middlewares  # Funções intermediárias (authMiddleware.js, verificarPerfil.js)
|-- /routes       # Definição dos endpoints da API (auth.js, usuarios.js, etc.)
|-- /utils        # Funções utilitárias (auditoria.js, mailer.js)
|-- server.js     # Ponto de entrada da aplicação
|-- package.json
2.2. Arquitetura do Frontend
O frontend é uma Single-Page Application (SPA) construída com React.

Stack Tecnológico:

Biblioteca Principal: React (com Hooks).

Roteamento: react-router-dom para navegação dinâmica e proteção de rotas.

Gestão de Estado Global: React Context API (AuthContext) para gerir o estado de autenticação e os dados do utilizador em toda a aplicação.

Cliente HTTP: axios para realizar chamadas à API do backend, com uma instância configurada para injetar automaticamente o token de autenticação.

Estrutura de Ficheiros:

/frontend
|-- /src
    |-- /api          # Configuração da instância do Axios (axios.js)
    |-- /components   # Componentes reutilizáveis (PrivateRoute.jsx, Layout.jsx)
    |-- /context      # Gestão de estado global (AuthContext.js)
    |-- /pages        # Componentes de página (Dashboard.jsx, Login.jsx, etc.)
    |-- /services     # Funções que encapsulam chamadas à API (usuariosService.js)
    |-- App.js        # Definição de rotas
    |-- index.js      # Ponto de entrada da aplicação React
3. Guia de Implantação (Produção / QA)
Esta secção contém todos os passos necessários para configurar o ambiente e implantar a aplicação do zero.

3.1. Pré-requisitos
Node.js: Versão 14 ou superior.

MySQL: Um servidor de banco de dados MySQL ou compatível (como MariaDB).

Git: Para clonar o repositório.

3.2. Estrutura e Configuração do Banco de Dados
Passo 1: Criar o Banco de Dados
Conecte-se ao seu servidor MySQL e execute o seguinte comando:

SQL

CREATE DATABASE IF NOT EXISTS `cadastro_colaboradores`;
Passo 2: Criar as Tabelas
Use o banco de dados recém-criado (USE cadastro_colaboradores;) e execute o script SQL abaixo para criar todas as tabelas e seus relacionamentos.

SQL

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

-- Tabela de Utilizadores
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

-- Tabela para Solicitações de Cadastro
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

-- Tabela do Inventário LGPD (Principal)
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
Passo 3: Inserir Dados Iniciais Obrigatórios (Seed)
Execute os seguintes comandos SQL para popular as tabelas com os dados mínimos necessários para o sistema funcionar.

SQL

-- Inserir Perfis de Acesso
INSERT INTO perfis (id, nome) VALUES
(1, 'Master'),
(2, 'Coordenador'),
(3, 'Usuario')
ON DUPLICATE KEY UPDATE nome=VALUES(nome);

-- Inserir um Setor e uma Função Padrão para o Admin
INSERT INTO setores (nome, sigla) VALUES ('Administração Master', 'MASTER')
ON DUPLICATE KEY UPDATE nome=VALUES(nome);

INSERT INTO funcoes (nome) VALUES ('Administrador do Sistema')
ON DUPLICATE KEY UPDATE nome=VALUES(nome);

-- Inserir o Utilizador Master
-- Credenciais: admin@iti.gov.br / davi080401
INSERT INTO usuarios (nome, email, senha_hash, perfil_id, tipo_usuario, setor_id, funcao_id, status)
VALUES (
    'Administrador Master',
    'admin@iti.gov.br',
    '$2a$10$f3i5b8a1e6c9d2f7g1h3i.o5j4k2l1m0n9p8q7r6s5t4u3v2w1x0y', -- Hash gerado para 'davi080401'
    1,
    'COORDENADOR',
    (SELECT id FROM setores WHERE sigla = 'MASTER'),
    (SELECT id FROM funcoes WHERE nome = 'Administrador do Sistema'),
    'ativo'
);
Nota de Segurança: O hash da senha acima é um valor de exemplo. Para máxima segurança, recomenda-se gerar um novo hash para a senha desejada ao implantar em produção, utilizando o script gerarHash.js presente no projeto.

2.3. Configuração do Backend
Clone o repositório para a sua máquina de produção.

Navegue até a pasta do backend (cd /caminho/para/backend).

Crie o ficheiro de ambiente: Crie um ficheiro chamado .env e preencha com as suas credenciais.

Snippet de código

# Configuração do Banco de Dados
DB_HOST=localhost
DB_USER=seu_usuario_mysql
DB_PASSWORD=sua_senha_do_banco
DB_DATABASE=cadastro_colaboradores

# Segredos do JWT (JSON Web Token) - MUDE ESTES VALORES EM PRODUÇÃO!
JWT_SECRET=gere_uma_string_aleatoria_longa_e_segura_aqui
JWT_REFRESH_SECRET=gere_outra_string_aleatoria_longa_e_segura_aqui

# Configuração de Email (Opcional, para notificação)
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USER=seu-email@example.com
MAIL_PASS=sua-senha-de-email
Instale as dependências:

Bash

npm install
Execute o servidor: Para produção, recomenda-se usar um gestor de processos como o PM2.

Bash

# Instale o PM2 globalmente (apenas uma vez)
npm install pm2 -g
# Inicie a aplicação com o PM2
pm2 start server.js --name "inventario-api"
2.4. Configuração do Frontend
Navegue até a pasta do frontend (cd /caminho/para/frontend).

Instale as dependências:

Bash

npm install
Crie o build de produção:

Bash

npm run build

mysql -h 127.0.0.1 -P 3306 -u root -p

