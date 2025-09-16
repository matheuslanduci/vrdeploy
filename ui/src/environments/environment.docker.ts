// Configuração de ambiente para Docker
// Este arquivo permite configuração dinâmica via variáveis de ambiente

declare const window: any

const getEnvVar = (key: string, defaultValue: string): string => {
  // Tentar pegar da window.__env (configurado pelo docker-entrypoint.sh)
  if (typeof window !== 'undefined' && window.__env && window.__env[key]) {
    return window.__env[key]
  }

  // Fallback para valores padrão
  return defaultValue
}

export const environment = {
  apiURL: getEnvVar('apiURL', 'http://localhost:3000/api'),
  wsURL: getEnvVar('wsURL', 'ws://localhost:3000/pubsub')
}
