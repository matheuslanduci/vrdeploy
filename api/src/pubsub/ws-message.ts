import z from 'zod'

export const heartbeatMessage = z.object({
  type: z.literal('heartbeat')
})

export const agenteEvent = z.enum(['agente:updated'])

export const subscribeAgenteEventMessage = z.object({
  type: z.literal('subscribe'),
  event: agenteEvent
})

export const agenteMessage = z.union([
  heartbeatMessage,
  subscribeAgenteEventMessage
])
