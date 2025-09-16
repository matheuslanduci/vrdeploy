# Multi-stage build para aplicação Angular
# Stage 1: Build da aplicação
FROM node:20-alpine AS builder

# Definir diretório de trabalho
WORKDIR /app

# Instalar dependências do sistema necessárias para build
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git

# Copiar arquivos de configuração do monorepo (da raiz)
COPY package*.json ./

# Copiar package.json da UI para ter as dependências específicas
COPY ui/package.json ./ui/package.json

# Instalar dependências do monorepo (incluindo devDependencies)
RUN npm install

# Copiar código fonte da UI
COPY ui/ ./ui/

# Copiar shared package se existir
COPY shared/ ./shared/

# Definir diretório de trabalho para a UI
WORKDIR /app/ui

# Instalar dependências específicas da UI (incluindo Angular CLI)
RUN npm install

# Build da aplicação para produção
RUN npm run build -- --configuration=docker

# Stage 2: Servidor web Nginx
FROM nginx:alpine

# Instalar curl para healthcheck
RUN apk add --no-cache curl

# Copiar configuração customizada do Nginx
COPY ui/nginx.conf /etc/nginx/nginx.conf

# Copiar arquivos buildados do stage anterior
COPY --from=builder /app/ui/dist/ui /usr/share/nginx/html

# Criar script para substituir variáveis de ambiente em runtime
COPY ui/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Criar usuário não-root para segurança (usar grupo nginx existente)
RUN adduser -S nginxuser -u 1001 -G nginx

# Ajustar permissões
RUN chown -R nginxuser:nginx /usr/share/nginx/html && \
    chown -R nginxuser:nginx /var/cache/nginx && \
    chown -R nginxuser:nginx /var/log/nginx && \
    chown -R nginxuser:nginx /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nginxuser:nginx /var/run/nginx.pid

# Expor porta
EXPOSE 80

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:80/ || exit 1

# Usar usuário não-root
USER nginxuser

# Comando de inicialização
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]