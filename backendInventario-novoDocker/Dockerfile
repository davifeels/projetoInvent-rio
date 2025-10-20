# Use a imagem oficial do Node.js
FROM node:18

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Copia os arquivos de dependências
COPY package*.json ./

# Instala as dependências
RUN npm install

# Copia o restante do código da aplicação
COPY . .

# Expõe a porta padrão (ajuste conforme necessário)
EXPOSE 3000

# Comando para iniciar o serviço
CMD ["npm", "start"]