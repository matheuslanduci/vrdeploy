import { serve } from '@hono/node-server'
import { createNodeWebSocket } from '@hono/node-ws'
import { Hono } from 'hono'
import { cors } from 'hono/cors'

export const app = new Hono().use(cors())

const { injectWebSocket } = createNodeWebSocket({ app })

const server = serve(app)
injectWebSocket(server)
