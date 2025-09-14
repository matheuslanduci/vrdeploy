import { zValidator } from '@hono/zod-validator'
import { and, asc, count, eq, getTableColumns, isNull } from 'drizzle-orm'
import { Hono } from 'hono'
import z from 'zod'
import { requireAuth, requirePermission } from '~/auth'
import { db } from '~/database'
import { redeTable } from '~/rede/rede.sql'
import { assert } from '~/util/assert'
import { lojaTable } from '../loja/loja.sql'
import { pdvTable } from './pdv.sql'

export const pdvRouter = new Hono()

pdvRouter.use(requireAuth())

pdvRouter.get(
  '/pdv',
  requirePermission('pdv', 'read'),
  zValidator(
    'query',
    z.object({
      page: z.coerce.number().min(1).default(1),
      pageSize: z.coerce.number().min(1).max(100).default(10),
      idLoja: z.coerce.number().min(1).optional(),
      idRede: z.coerce.number().min(1).optional()
    })
  ),
  async (c) => {
    const { page, pageSize, idLoja, idRede } = c.req.valid('query')

    let whereConditions = and(
      isNull(pdvTable.deletedAt),
      idLoja ? eq(pdvTable.idLoja, idLoja) : undefined,
      idRede ? eq(lojaTable.idRede, idRede) : undefined
    )

    const pdvs = await db
      .select({
        ...getTableColumns(pdvTable),
        loja: getTableColumns(lojaTable),
        rede: getTableColumns(redeTable)
      })
      .from(pdvTable)
      .innerJoin(lojaTable, eq(pdvTable.idLoja, lojaTable.id))
      .innerJoin(redeTable, eq(lojaTable.idRede, redeTable.id))
      .where(whereConditions)
      .orderBy(asc(pdvTable.id))
      .limit(pageSize)
      .offset((page - 1) * pageSize)
      .execute()

    const [total] = await db
      .select({
        count: count()
      })
      .from(pdvTable)
      .innerJoin(lojaTable, eq(pdvTable.idLoja, lojaTable.id))
      .where(whereConditions)
      .execute()

    assert(total?.count !== undefined, 'Total count query failed')

    return c.json({
      data: pdvs,
      meta: {
        page,
        pageSize,
        total: total.count,
        totalPages: Math.ceil(total.count / pageSize)
      }
    })
  }
)

pdvRouter.get(
  '/pdv/:idPdv',
  requirePermission('pdv', 'read'),
  zValidator(
    'param',
    z.object({
      idPdv: z.coerce.number().min(1)
    })
  ),
  async (c) => {
    const { idPdv } = c.req.valid('param')

    const [pdv] = await db
      .select()
      .from(pdvTable)
      .where(and(eq(pdvTable.id, idPdv), isNull(pdvTable.deletedAt)))
      .execute()

    if (!pdv) return c.text('PDV não encontrado', 404)

    return c.json(pdv)
  }
)

pdvRouter.post(
  '/pdv',
  requirePermission('pdv', 'create'),
  zValidator(
    'json',
    z.object({
      idLoja: z.number().min(1),
      nome: z.string().min(1).max(255)
    })
  ),
  async (c) => {
    const { idLoja, nome } = c.req.valid('json')

    const [existingLoja] = await db
      .select()
      .from(lojaTable)
      .where(and(eq(lojaTable.id, idLoja), isNull(lojaTable.deletedAt)))
      .execute()

    if (!existingLoja) return c.text('Loja não encontrada', 404)

    const [pdv] = await db
      .insert(pdvTable)
      .values({
        idLoja,
        nome
      })
      .returning()
      .execute()

    return c.json(pdv, 201)
  }
)

pdvRouter.put(
  '/pdv/:idPdv',
  requirePermission('pdv', 'update'),
  zValidator(
    'param',
    z.object({
      idPdv: z.coerce.number().min(1)
    })
  ),
  zValidator(
    'json',
    z.object({
      idLoja: z.number().min(1),
      nome: z.string().min(1).max(255)
    })
  ),
  async (c) => {
    const { idPdv } = c.req.valid('param')
    const { idLoja, nome } = c.req.valid('json')

    const [existingPdv] = await db
      .select()
      .from(pdvTable)
      .where(and(eq(pdvTable.id, idPdv), isNull(pdvTable.deletedAt)))
      .execute()

    if (!existingPdv) return c.text('PDV não encontrado', 404)

    const [existingLoja] = await db
      .select()
      .from(lojaTable)
      .where(and(eq(lojaTable.id, idLoja), isNull(lojaTable.deletedAt)))
      .execute()

    if (!existingLoja) return c.text('Loja não encontrada', 404)

    const [pdv] = await db
      .update(pdvTable)
      .set({
        idLoja,
        nome
      })
      .where(eq(pdvTable.id, idPdv))
      .returning()
      .execute()

    return c.json(pdv)
  }
)

pdvRouter.delete(
  '/pdv/:idPdv',
  requirePermission('pdv', 'delete'),
  zValidator(
    'param',
    z.object({
      idPdv: z.coerce.number().min(1)
    })
  ),
  async (c) => {
    const { idPdv } = c.req.valid('param')

    const [existingPdv] = await db
      .select()
      .from(pdvTable)
      .where(and(eq(pdvTable.id, idPdv), isNull(pdvTable.deletedAt)))
      .execute()

    if (!existingPdv) return c.text('PDV não encontrado', 404)

    await db
      .update(pdvTable)
      .set({
        deletedAt: new Date()
      })
      .where(eq(pdvTable.id, idPdv))
      .execute()

    return c.newResponse(null, 204)
  }
)
