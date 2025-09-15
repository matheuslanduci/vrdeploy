import z from 'zod'

export const heartbeatMessage = z.object({
  type: z.literal('heartbeat')
})

export const agenteEvent = z.enum([
  'agente:updated',
  'pty:session_started',
  'pty:input',
  'implantacao:created'
])

export const ptyOutputEvent = z.object({
  type: z.literal('publish'),
  event: z.literal('pty:output'),
  data: z.string()
})

export const ptySessionEndedEvent = z.object({
  type: z.literal('publish'),
  event: z.literal('pty:session_ended'),
  data: z.string()
})

export const publishAgenteEventMessage = z.union([
  ptyOutputEvent,
  ptySessionEndedEvent
])

export const publishPtyInputEventMessage = z.object({
  type: z.literal('publish'),
  event: z.literal('pty:input'),
  data: z.object({
    idAgente: z.number(),
    input: z.string()
  })
})

export const publishUserEventMessage = z.union([publishPtyInputEventMessage])

export const subscribeAgenteEventMessage = z.object({
  type: z.literal('subscribe'),
  event: agenteEvent
})

export const subscribeUserToSessionOutputMessage = z.object({
  type: z.literal('subscribe'),
  event: z.literal('pty:output'),
  data: z.object({
    idAgente: z.number()
  })
})

export const subscribeUserEventMessage = z.union([
  subscribeUserToSessionOutputMessage
])

export const agenteMessage = z.union([
  heartbeatMessage,
  subscribeAgenteEventMessage,
  publishAgenteEventMessage
])

export const userMessage = z.union([
  heartbeatMessage,
  subscribeUserEventMessage,
  publishUserEventMessage
])
