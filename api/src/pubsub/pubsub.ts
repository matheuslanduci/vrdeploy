import z from 'zod'
import { redis } from '~/redis'
import { agenteEvent } from './ws-message'

export const pubsub = redis.duplicate()

export async function registerAgente(agenteId: number) {
  await redis.set(`agente:${agenteId}`, 'online', 'EX', 60)
}

export async function unregisterAgente(agenteId: number) {
  await redis.del(`agente:${agenteId}`)
}

export async function isAgenteOnline(agenteId: number): Promise<boolean> {
  return redis.get(`agente:${agenteId}`).then((res) => res === 'online')
}

export function createChannelName(
  agenteId: number,
  event: z.infer<typeof agenteEvent>
) {
  return `agente:${agenteId}:${event}`
}
