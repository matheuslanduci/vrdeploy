# Dockerfile simples para desenvolvimento Angular
FROM node:20-alpine

# Instalar curl para healthcheck
RUN apk add --no-cache curl

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de configuração do monorepo
COPY package*.json ./

# Copiar código fonte
COPY ui/ ./ui/
COPY shared/ ./shared/

# Instalar dependências
RUN npm install

# Definir diretório de trabalho da UI
WORKDIR /app/ui

# Expor porta
EXPOSE 4200

# Comando simples para rodar o servidor
CMD ["npm", "start", "--", "--host", "0.0.0.0"]