import { zValidator } from '@hono/zod-validator'
import { and, asc, count, eq, getTableColumns, isNull } from 'drizzle-orm'
import { Hono } from 'hono'
import z from 'zod'
import { requireAuth, requirePermission } from '~/auth'
import { db } from '~/database'
import { assert } from '~/util/assert'
import { redeTable } from '../rede/rede.sql'
import { lojaTable } from './loja.sql'

export const lojaRouter = new Hono()

lojaRouter.use(requireAuth())

lojaRouter.get(
  '/loja',
  requirePermission('loja', 'read'),
  zValidator(
    'query',
    z.object({
      page: z.coerce.number().min(1).default(1),
      pageSize: z.coerce.number().min(1).max(100).default(10),
      idRede: z.coerce.number().min(1).optional()
    })
  ),
  async (c) => {
    const { page, pageSize, idRede } = c.req.valid('query')

    const whereConditions = and(
      isNull(lojaTable.deletedAt),
      idRede ? eq(lojaTable.idRede, idRede) : undefined
    )

    const lojas = await db
      .select({
        ...getTableColumns(lojaTable),
        rede: getTableColumns(redeTable)
      })
      .from(lojaTable)
      .innerJoin(redeTable, eq(lojaTable.idRede, redeTable.id))
      .where(whereConditions)
      .orderBy(asc(lojaTable.id))
      .limit(pageSize)
      .offset((page - 1) * pageSize)
      .execute()
    const [total] = await db
      .select({
        count: count()
      })
      .from(lojaTable)
      .where(whereConditions)
      .execute()

    assert(total?.count !== undefined, 'Total count query failed')

    return c.json({
      data: lojas,
      meta: {
        page,
        pageSize,
        total: total.count,
        totalPages: Math.ceil(total.count / pageSize)
      }
    })
  }
)

lojaRouter.get(
  '/loja/:idLoja',
  requirePermission('loja', 'read'),
  zValidator(
    'param',
    z.object({
      idLoja: z.coerce.number().min(1)
    })
  ),
  async (c) => {
    const { idLoja } = c.req.valid('param')

    const [loja] = await db
      .select()
      .from(lojaTable)
      .where(and(eq(lojaTable.id, idLoja), isNull(lojaTable.deletedAt)))
      .execute()

    if (!loja) return c.text('Loja não encontrada', 404)

    return c.json(loja)
  }
)

lojaRouter.post(
  '/loja',
  requirePermission('loja', 'create'),
  zValidator(
    'json',
    z.object({
      idRede: z.number().min(1),
      nome: z.string().min(1).max(255)
    })
  ),
  async (c) => {
    const { idRede, nome } = c.req.valid('json')

    const [existingRede] = await db
      .select()
      .from(redeTable)
      .where(and(eq(redeTable.id, idRede), isNull(redeTable.deletedAt)))
      .execute()

    if (!existingRede) return c.text('Rede não encontrada', 404)

    const [loja] = await db
      .insert(lojaTable)
      .values({
        idRede,
        nome
      })
      .returning()
      .execute()

    return c.json(loja, 201)
  }
)

lojaRouter.put(
  '/loja/:idLoja',
  requirePermission('loja', 'update'),
  zValidator(
    'param',
    z.object({
      idLoja: z.coerce.number().min(1)
    })
  ),
  zValidator(
    'json',
    z.object({
      idRede: z.number().min(1),
      nome: z.string().min(1).max(255)
    })
  ),
  async (c) => {
    const { idLoja } = c.req.valid('param')
    const { idRede, nome } = c.req.valid('json')

    const [existingLoja] = await db
      .select()
      .from(lojaTable)
      .where(and(eq(lojaTable.id, idLoja), isNull(lojaTable.deletedAt)))
      .execute()

    if (!existingLoja) return c.text('Loja não encontrada', 404)

    const [existingRede] = await db
      .select()
      .from(redeTable)
      .where(and(eq(redeTable.id, idRede), isNull(redeTable.deletedAt)))
      .execute()

    if (!existingRede) return c.text('Rede não encontrada', 404)

    const [loja] = await db
      .update(lojaTable)
      .set({
        idRede,
        nome
      })
      .where(eq(lojaTable.id, idLoja))
      .returning()
      .execute()

    return c.json(loja)
  }
)

lojaRouter.delete(
  '/loja/:idLoja',
  requirePermission('loja', 'delete'),
  zValidator(
    'param',
    z.object({
      idLoja: z.coerce.number().min(1)
    })
  ),
  async (c) => {
    const { idLoja } = c.req.valid('param')

    const [existingLoja] = await db
      .select()
      .from(lojaTable)
      .where(and(eq(lojaTable.id, idLoja), isNull(lojaTable.deletedAt)))
      .execute()

    if (!existingLoja) return c.text('Loja não encontrada', 404)

    await db
      .update(lojaTable)
      .set({
        deletedAt: new Date()
      })
      .where(eq(lojaTable.id, idLoja))
      .execute()

    return c.newResponse(null, 204)
  }
)
