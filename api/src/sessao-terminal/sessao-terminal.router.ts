import { zValidator } from '@hono/zod-validator'
import { and, eq, isNull } from 'drizzle-orm'
import { Hono } from 'hono'
import { nanoid } from 'nanoid'
import z from 'zod'
import { agenteTable } from '~/agente/agente.sql'
import { requireAuth, requirePermission } from '~/auth'
import { db } from '~/database'
import { generateAgenteChannelName, publisher } from '~/pubsub/pubsub'
import { redis } from '~/redis'

export const sessaoTerminalRouter = new Hono()

sessaoTerminalRouter.post(
  '/sessao-terminal/:idAgente',
  requireAuth(),
  requirePermission('agente', 'update'),
  zValidator(
    'param',
    z.object({
      idAgente: z.coerce.number().min(1)
    })
  ),
  async (c) => {
    const { idAgente } = c.req.valid('param')

    const [agente] = await db
      .select()
      .from(agenteTable)
      .where(and(eq(agenteTable.id, idAgente), isNull(agenteTable.deletedAt)))
      .limit(1)
      .execute()

    if (!agente) return c.text('Agente não encontrado', 404)

    if (agente.situacao !== 'aprovado' || !agente.idPdv) {
      return c.text(
        'Sessão de terminal só pode ser iniciada para agentes aprovados e vinculados a um PDV',
        400
      )
    }

    const user = c.get('user')
    const sessionId = nanoid(24)

    await redis.set(
      `sessao-terminal:${sessionId}`,
      `${user.id}:${idAgente}`,
      'EX',
      300
    )
    await publisher.publish(
      generateAgenteChannelName(idAgente, 'pty:session_started'),
      JSON.stringify({ idAgente })
    )

    return c.json({ sessionId }, 201)
  }
)
