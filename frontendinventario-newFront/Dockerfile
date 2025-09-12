# Estágio 1: Build da aplicação React
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
# Gera a pasta 'build' com os arquivos estáticos da aplicação
RUN npm run build

# Estágio 2: Servir os arquivos estáticos com Nginx
FROM nginx:stable-alpine

# Copia os arquivos da pasta 'build' do estágio anterior para a pasta do Nginx
COPY --from=build /app/build /usr/share/nginx/html

# O Nginx, por padrão, serve na porta 80
EXPOSE 80

# Comando para iniciar o Nginx
CMD ["nginx", "-g", "daemon off;"]
