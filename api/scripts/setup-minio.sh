#!/bin/bash

# Script de setup do MinIO para VRDeploy
# Este script configura buckets, usuários e políticas no MinIO

set -e

# Variáveis de configuração
MINIO_HOST=${MINIO_HOST:-"http://localhost:9000"}
MINIO_ADMIN_USER=${MINIO_ADMIN_USER:-"minioadmin"}
MINIO_ADMIN_PASSWORD=${MINIO_ADMIN_PASSWORD:-"minioadmin123"}
APP_ACCESS_KEY=${APP_ACCESS_KEY:-"15fpbK8MQhem92Bgjzik"}
APP_SECRET_KEY=${APP_SECRET_KEY:-"76qqNaOwRqsHbqz3ueWlwZumNRQfIj9Y12phxF5m"}
BUCKET_NAME=${BUCKET_NAME:-"vrdeploy"}

echo "🚀 Iniciando setup do MinIO..."

# Função para aguardar MinIO estar disponível
wait_for_minio() {
    echo "⏳ Aguardando MinIO ficar disponível..."
    until mc alias set minio $MINIO_HOST $MINIO_ADMIN_USER $MINIO_ADMIN_PASSWORD > /dev/null 2>&1; do
        echo "MinIO ainda não está disponível. Aguardando..."
        sleep 5
    done
    echo "✅ MinIO está disponível!"
}

# Função para criar bucket
create_bucket() {
    echo "📁 Criando bucket '$BUCKET_NAME'..."
    if mc mb --ignore-existing minio/$BUCKET_NAME; then
        echo "✅ Bucket '$BUCKET_NAME' criado/verificado com sucesso!"
    else
        echo "❌ Erro ao criar bucket '$BUCKET_NAME'"
        exit 1
    fi
}

# Função para criar usuário da aplicação
create_app_user() {
    echo "👤 Criando usuário da aplicação..."
    
    # Criar usuário se não existir
    if mc admin user add minio $APP_ACCESS_KEY $APP_SECRET_KEY 2>/dev/null; then
        echo "✅ Usuário '$APP_ACCESS_KEY' criado com sucesso!"
    else
        echo "ℹ️ Usuário '$APP_ACCESS_KEY' já existe ou erro na criação"
    fi
}

# Função para criar política personalizada
create_custom_policy() {
    echo "📋 Criando política personalizada..."
    
    # Criar arquivo de política temporário
    cat > /tmp/vrdeploy-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::${BUCKET_NAME}",
                "arn:aws:s3:::${BUCKET_NAME}/*"
            ]
        }
    ]
}
EOF

    # Aplicar política
    if mc admin policy create minio vrdeploy-policy /tmp/vrdeploy-policy.json; then
        echo "✅ Política 'vrdeploy-policy' criada com sucesso!"
    else
        echo "ℹ️ Política 'vrdeploy-policy' já existe ou erro na criação"
    fi
    
    # Remover arquivo temporário
    rm -f /tmp/vrdeploy-policy.json
}

# Função para aplicar política ao usuário
apply_policy_to_user() {
    echo "🔐 Aplicando política ao usuário..."
    
    if mc admin policy attach minio vrdeploy-policy --user $APP_ACCESS_KEY; then
        echo "✅ Política aplicada ao usuário '$APP_ACCESS_KEY'!"
    else
        echo "ℹ️ Política já aplicada ou erro na aplicação"
    fi
}

# Função para configurar bucket policy (público para leitura se necessário)
configure_bucket_policy() {
    echo "🌐 Configurando política do bucket..."
    
    # Criar política de bucket para leitura pública (opcional)
    cat > /tmp/bucket-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::${BUCKET_NAME}/public/*"
        }
    ]
}
EOF

    # Aplicar política ao bucket (comentado por segurança)
    # mc anonymous set-json /tmp/bucket-policy.json minio/$BUCKET_NAME
    
    echo "ℹ️ Política de bucket configurada (apenas para arquivos em /public/)"
    rm -f /tmp/bucket-policy.json
}

# Função para verificar configuração
verify_setup() {
    echo "🔍 Verificando configuração..."
    
    echo "Buckets disponíveis:"
    mc ls minio/
    
    echo "Usuários configurados:"
    mc admin user list minio
    
    echo "Políticas disponíveis:"
    mc admin policy list minio
}

# Executar setup
main() {
    echo "🎯 Configurando MinIO para VRDeploy"
    echo "Host: $MINIO_HOST"
    echo "Bucket: $BUCKET_NAME"
    echo "User: $APP_ACCESS_KEY"
    echo ""
    
    wait_for_minio
    create_bucket
    create_app_user
    create_custom_policy
    apply_policy_to_user
    configure_bucket_policy
    verify_setup
    
    echo ""
    echo "🎉 Setup do MinIO concluído com sucesso!"
    echo ""
    echo "📝 Configurações para usar na aplicação:"
    echo "S3_ENDPOINT=$MINIO_HOST"
    echo "S3_ACCESS_KEY=$APP_ACCESS_KEY"
    echo "S3_SECRET_KEY=$APP_SECRET_KEY"
    echo "S3_BUCKET=$BUCKET_NAME"
}

# Executar apenas se chamado diretamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi