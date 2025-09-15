import { serve } from '@hono/node-server'
import { createNodeWebSocket } from '@hono/node-ws'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { agenteRouter } from './agente/agente.router'
import { auth, requireAgenteAuth, requireAuth } from './auth'
import { lojaRouter } from './loja/loja.router'
import { pdvRouter } from './pdv/pdv.router'
import { pubsubAgenteHandler, pubsubUserHandler } from './pubsub/pubsub.router'
import { redeRouter } from './rede/rede.router'
import { sessaoTerminalRouter } from './sessao-terminal/sessao-terminal.router'
import { versaoRouter } from './versao/versao.router'

const app = new Hono()

app.use(
  cors({
    origin: 'http://localhost:4200',
    credentials: true,
    allowHeaders: [
      'Content-Type',
      'Authorization',
      'X-CSRF-Token',
      'X-Requested-With'
    ],
    exposeHeaders: ['X-CSRF-Token'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD']
  })
)
app.use(logger())

app.on(['POST', 'GET', 'OPTIONS'], '/api/auth/*', (c) =>
  auth.handler(c.req.raw)
)

app.route('/api', agenteRouter)
app.route('/api', lojaRouter)
app.route('/api', pdvRouter)
app.route('/api', redeRouter)
app.route('/api', sessaoTerminalRouter)
app.route('/api', versaoRouter)

export const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({
  app
})

app.get('/pubsub/agente', requireAgenteAuth(), async (c) => {
  const agente = c.get('agente')

  return upgradeWebSocket(c, pubsubAgenteHandler(agente))
})

app.get('/pubsub/user', requireAuth(), async (c) => {
  const user = c.get('user')

  return upgradeWebSocket(c, pubsubUserHandler(user))
})

const server = serve(app, (address) => {
  console.log(`Server started on http://localhost:${address.port}`)
})
injectWebSocket(server)
