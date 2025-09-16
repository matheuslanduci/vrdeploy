#!/bin/sh

# Script de entrada para configurar variáveis de ambiente em runtime
# Este script substitui as variáveis de ambiente no arquivo de configuração Angular

set -e

echo "🚀 Iniciando configuração da aplicação Angular..."

# Definir valores padrão das variáveis se não estiverem definidas
API_URL=${API_URL:-"http://localhost:3000/api"}
WS_URL=${WS_URL:-"ws://localhost:3000/pubsub"}

echo "📝 Configurando variáveis de ambiente:"
echo "API_URL: $API_URL"
echo "WS_URL: $WS_URL"

# Encontrar todos os arquivos JavaScript buildados
JS_FILES=$(find /app -name "*.js" -type f)

if [ -z "$JS_FILES" ]; then
    echo "⚠️ Nenhum arquivo JavaScript encontrado. Usando configuração padrão."
else
    echo "🔧 Substituindo variáveis de ambiente nos arquivos JavaScript..."
    
    # Substituir as URLs nos arquivos buildados
    for file in $JS_FILES; do
        echo "Processando: $file"
        
        # Substituir URL da API
        sed -i "s|http://localhost:3000/api|$API_URL|g" "$file"
        
        # Substituir URL do WebSocket
        sed -i "s|ws://localhost:3000/pubsub|$WS_URL|g" "$file"
    done
fi

# Criar pasta assets se não existir
mkdir -p /app/assets

# Criar arquivo de configuração dinâmica (método alternativo)
cat > /app/assets/config.js << EOF
window.__env = window.__env || {};
window.__env.apiURL = '$API_URL';
window.__env.wsURL = '$WS_URL';
EOF

echo "✅ Configuração concluída!"

# Executar o comando passado como argumentos
echo "🎯 Iniciando Nginx..."
exec "$@"