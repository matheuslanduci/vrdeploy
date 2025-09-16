# Usar imagem Node.js LTS baseada em Alpine para menor tamanho
FROM node:22-alpine

# Definir diretório de trabalho
WORKDIR /app

# Instalar dependências do sistema necessárias
RUN apk add --no-cache \
    postgresql-client \
    curl \
    bash

# Copiar arquivos de configuração do monorepo (da raiz)
COPY package*.json ./

# Copiar package.json da API
COPY api/package.json ./

# Instalar dependências do monorepo e da API
RUN npm install

# Instalar tsx globalmente para facilitar execução
RUN npm install -g tsx

# Criar usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs && \
    adduser -S apiuser -u 1001

# Copiar código fonte da API para a raiz
COPY api/ ./

# Copiar shared package se existir  
COPY shared/ ./shared/

# Mudar propriedade dos arquivos para o usuário não-root
RUN chown -R apiuser:nodejs /app
USER apiuser

# Expor porta da aplicação
EXPOSE 3000

# Comando de healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Comando padrão para iniciar a aplicação
CMD ["npm", "run", "dev"]