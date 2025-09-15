import z from 'zod'
import { redis } from '~/redis'
import { agenteEvent, subscribeUserEventMessage } from './ws-message'

export const subscriber = redis.duplicate()
export const publisher = redis.duplicate()

export async function registerAgente(agenteId: number) {
  await redis.set(`agente:${agenteId}`, 'online', 'EX', 60)
}

export async function registerUser(userId: string) {
  await redis.set(`user:${userId}`, 'online', 'EX', 300)
}

export const renewAgente = registerAgente

export async function unregisterAgente(agenteId: number) {
  await redis.del(`agente:${agenteId}`)
}

export async function unregisterUser(userId: string) {
  await redis.del(`user:${userId}`)
}

export async function isAgenteOnline(agenteId: number): Promise<boolean> {
  return redis.get(`agente:${agenteId}`).then((res) => res === 'online')
}

export function generateAgenteChannelName(
  agenteId: number,
  event: z.infer<typeof agenteEvent>
) {
  return `agente:${agenteId}:${event}`
}

export function generateUserChannelName(
  userId: string,
  message: z.infer<typeof subscribeUserEventMessage>
) {
  switch (message.event) {
    case 'pty:output':
      return `session:${message.data.idAgente}:output`
  }
}
