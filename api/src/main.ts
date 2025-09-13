import { serve } from '@hono/node-server'
import { createNodeWebSocket } from '@hono/node-ws'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { auth } from './auth'
import { lojaRouter } from './loja/loja.router'
import { pdvRouter } from './pdv/pdv.router'
import { redeRouter } from './rede/rede.router'

export const app = new Hono()
  .use(cors())
  .use(logger())
  .on(['POST', 'GET'], '/api/auth/*', (c) => auth.handler(c.req.raw))
  .route('/api', lojaRouter)
  .route('/api', pdvRouter)
  .route('/api', redeRouter)

const { injectWebSocket } = createNodeWebSocket({ app })

const server = serve(app, (address) => {
  console.log(`Server started on http://localhost:${address.port}`)
})
injectWebSocket(server)

export type App = typeof app
