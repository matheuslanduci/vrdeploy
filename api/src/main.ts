import { serve } from '@hono/node-server'
import { createNodeWebSocket } from '@hono/node-ws'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { auth } from './auth'

export const app = new Hono()
  .use(cors())
  .on(['POST', 'GET'], '/api/auth/*', (c) => auth.handler(c.req.raw))

const { injectWebSocket } = createNodeWebSocket({ app })

const server = serve(app)
injectWebSocket(server)
