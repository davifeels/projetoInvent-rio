const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Configuração da documentação
const options = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'API Cadastro & Inventário',
      version: '1.0.0',
      description: 'Documentação da API para cadastro e gerenciamento de inventário de dados pessoais',
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
      },
    ],
  },
  apis: ['./routes/*.js'], // Roteamento das rotas que serão documentadas
};

const specs = swaggerJsDoc(options);

module.exports = { swaggerUi, specs };
