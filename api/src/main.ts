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

app.use(
  cors({
    origin: 'http://localhost:4200',
    credentials: true,
    allowHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    exposeHeaders: ['X-CSRF-Token'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  })
)
app.use(logger())

app.on(['POST', 'GET', 'OPTIONS'], '/api/auth/*', (c) =>
  auth.handler(c.req.raw)
)

app.route('/api', lojaRouter)
app.route('/api', pdvRouter)
app.route('/api', redeRouter)

const { injectWebSocket } = createNodeWebSocket({ app })

const server = serve(app, (address) => {
  console.log(`Server started on http://localhost:${address.port}`)
})
injectWebSocket(server)
