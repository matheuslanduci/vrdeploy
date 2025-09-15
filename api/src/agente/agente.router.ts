import { zValidator } from '@hono/zod-validator'
import { and, count, desc, eq, getTableColumns, isNull } from 'drizzle-orm'
import { Hono } from 'hono'
import { nanoid } from 'nanoid'
import z from 'zod'
import { requireAuth, requirePermission } from '~/auth'
import { db } from '~/database'
import { lojaTable } from '~/loja/loja.sql'
import { pdvTable } from '~/pdv/pdv.sql'
import { createChannelName, isAgenteOnline, publisher } from '~/pubsub/pubsub'
import { redeTable } from '~/rede/rede.sql'
import { assert } from '~/util/assert'
import { agenteSituacaoEnum, agenteTable } from './agente.sql'

export const agenteRouter = new Hono()

agenteRouter.get(
  '/agente',
  requireAuth(),
  requirePermission('agente', 'read'),
  zValidator(
    'query',
    z.object({
      page: z.coerce.number().min(1).default(1),
      pageSize: z.coerce.number().min(1).max(100).default(10),
      idPdv: z.coerce.number().min(1).optional(),
      idLoja: z.coerce.number().min(1).optional(),
      idRede: z.coerce.number().min(1).optional()
    })
  ),
  async (c) => {
    const { page, pageSize, idPdv, idLoja, idRede } = c.req.valid('query')

    const whereConditions = and(
      isNull(agenteTable.deletedAt),
      idPdv ? eq(agenteTable.idPdv, idPdv) : undefined,
      idLoja ? eq(lojaTable.id, idLoja) : undefined,
      idRede ? eq(redeTable.id, idRede) : undefined
    )

    const agentes = await db
      .select({
        id: agenteTable.id,
        idPdv: agenteTable.idPdv,
        enderecoMac: agenteTable.enderecoMac,
        sistemaOperacional: agenteTable.sistemaOperacional,
        ativo: agenteTable.ativo,
        situacao: agenteTable.situacao,
        createdAt: agenteTable.createdAt,
        updatedAt: agenteTable.updatedAt,
        deletedAt: agenteTable.deletedAt,
        pdv: getTableColumns(pdvTable),
        loja: getTableColumns(lojaTable),
        rede: getTableColumns(redeTable)
      })
      .from(agenteTable)
      .leftJoin(pdvTable, eq(agenteTable.idPdv, pdvTable.id))
      .leftJoin(lojaTable, eq(pdvTable.idLoja, lojaTable.id))
      .leftJoin(redeTable, eq(lojaTable.idRede, redeTable.id))
      .where(whereConditions)
      .orderBy(desc(agenteTable.id))
      .limit(pageSize)
      .offset((page - 1) * pageSize)
      .execute()

    const [total] = await db
      .select({
        count: count()
      })
      .from(agenteTable)
      .leftJoin(pdvTable, eq(agenteTable.idPdv, pdvTable.id))
      .leftJoin(lojaTable, eq(pdvTable.idLoja, lojaTable.id))
      .leftJoin(redeTable, eq(lojaTable.idRede, redeTable.id))
      .where(whereConditions)
      .execute()

    assert(total?.count !== undefined, 'Total count query failed')

    const agentesWithStatus = []

    for (const agente of agentes) {
      agentesWithStatus.push({
        ...agente,
        online: await isAgenteOnline(agente.id)
      })
    }

    return c.json({
      data: agentesWithStatus,
      meta: {
        page,
        pageSize,
        total: total.count,
        totalPages: Math.ceil(total.count / pageSize)
      }
    })
  }
)

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
      .returning({
        id: agenteTable.id,
        idPdv: agenteTable.idPdv,
        enderecoMac: agenteTable.enderecoMac,
        sistemaOperacional: agenteTable.sistemaOperacional,
        ativo: agenteTable.ativo,
        situacao: agenteTable.situacao,
        createdAt: agenteTable.createdAt,
        updatedAt: agenteTable.updatedAt,
        deletedAt: agenteTable.deletedAt
      })
      .execute()

    assert(updatedAgente, 'Erro ao atualizar agente')

    const channel = createChannelName(updatedAgente.id, 'agente:updated')
    await publisher.publish(channel, JSON.stringify(updatedAgente))

    return c.json(updatedAgente)
  }
)

agenteRouter.delete(
  '/agente/:id',
  requireAuth(),
  requirePermission('agente', 'delete'),
  zValidator(
    'param',
    z.object({
      id: z.coerce.number().min(1)
    })
  ),
  async (c) => {
    const { id } = c.req.valid('param')

    const [existingAgente] = await db
      .select()
      .from(agenteTable)
      .where(and(eq(agenteTable.id, id), isNull(agenteTable.deletedAt)))
      .limit(1)
      .execute()

    if (!existingAgente) return c.text('Agente não encontrado', 404)

    if (existingAgente.situacao !== 'rejeitado')
      return c.text(
        'Apenas agentes com situação rejeitado podem ser excluídos',
        400
      )

    await db
      .update(agenteTable)
      .set({
        deletedAt: new Date()
      })
      .where(eq(agenteTable.id, id))
      .execute()

    return c.newResponse(null, 204)
  }
)
