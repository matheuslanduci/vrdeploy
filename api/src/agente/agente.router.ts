import { zValidator } from '@hono/zod-validator'
import { and, eq, isNull } from 'drizzle-orm'
import { Hono } from 'hono'
import { nanoid } from 'nanoid'
import z from 'zod'
import { requireAuth, requirePermission } from '~/auth'
import { db } from '~/database'
import { createChannelName, pubsub } from '~/pubsub/pubsub'
import { assert } from '~/util/assert'
import { agenteSituacaoEnum, agenteTable } from './agente.sql'

export const agenteRouter = new Hono()

agenteRouter.post(
  '/agente',
  zValidator(
    'json',
    z.object({
      enderecoMac: z.string().length(17),
      sistemaOperacional: z.string().min(1)
    })
  ),
  async (c) => {
    const { enderecoMac, sistemaOperacional } = c.req.valid('json')

    const [agente] = await db
      .insert(agenteTable)
      .values({
        chaveSecreta: nanoid(48),
        situacao: 'pendente',
        enderecoMac,
        sistemaOperacional
      })
      .returning()
      .execute()

    assert(agente, 'Erro ao registrar agente')

    return c.json(agente, 201)
  }
)

agenteRouter.patch(
  '/agente/:id',
  requireAuth(),
  requirePermission('agente', 'approve'),
  zValidator(
    'param',
    z.object({
      id: z.coerce.number().min(1)
    })
  ),
  zValidator(
    'json',
    z.object({
      situacao: z.enum(agenteSituacaoEnum)
    })
  ),
  async (c) => {
    const { id } = c.req.valid('param')
    const { situacao } = c.req.valid('json')

    const [existingAgente] = await db
      .select()
      .from(agenteTable)
      .where(and(eq(agenteTable.id, id), isNull(agenteTable.deletedAt)))
      .limit(1)
      .execute()

    if (!existingAgente) return c.text('Agente não encontrado', 404)

    if (existingAgente.situacao !== 'pendente')
      return c.text('Agente já foi avaliado', 400)

    const [updatedAgente] = await db
      .update(agenteTable)
      .set({
        situacao
      })
      .where(eq(agenteTable.id, id))
      .returning()
      .execute()

    assert(updatedAgente, 'Erro ao atualizar agente')

    const channel = createChannelName(updatedAgente.id, 'agente:updated')
    await pubsub.publish(channel, JSON.stringify(updatedAgente))

    return c.json(updatedAgente)
  }
)
