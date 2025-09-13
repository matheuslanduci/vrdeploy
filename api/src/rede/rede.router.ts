import { zValidator } from '@hono/zod-validator'
import { and, asc, count, eq, isNull } from 'drizzle-orm'
import { Hono } from 'hono'
import z from 'zod'
import { requireAuth, requirePermission } from '~/auth'
import { db } from '~/database'
import { assert } from '~/util/assert'
import { redeTable } from './rede.sql'

export const redeRouter = new Hono()
  .use(requireAuth())
  .get(
    '/rede',
    requirePermission('rede', 'read'),
    zValidator(
      'query',
      z.object({
        page: z.coerce.number().min(1).default(1),
        pageSize: z.coerce.number().min(1).max(100).default(10)
      })
    ),
    async (c) => {
      const { page, pageSize } = c.req.valid('query')

      const redes = await db
        .select()
        .from(redeTable)
        .where(isNull(redeTable.deletedAt))
        .orderBy(asc(redeTable.id))
        .limit(pageSize)
        .offset((page - 1) * pageSize)
        .execute()
      const [total] = await db
        .select({
          count: count()
        })
        .from(redeTable)
        .where(isNull(redeTable.deletedAt))
        .execute()

      assert(total?.count !== undefined, 'Total count query failed')

      return c.json({
        data: redes,
        meta: {
          page,
          pageSize,
          total: total.count,
          totalPages: Math.ceil(total.count / pageSize)
        }
      })
    }
  )
  .get(
    '/rede/:idRede',
    requirePermission('rede', 'read'),
    zValidator(
      'param',
      z.object({
        idRede: z.coerce.number().min(1)
      })
    ),
    async (c) => {
      const { idRede } = c.req.valid('param')

      const [rede] = await db
        .select()
        .from(redeTable)
        .where(and(eq(redeTable.id, idRede), isNull(redeTable.deletedAt)))
        .execute()

      if (!rede) return c.text('Rede não encontrada', 404)

      return c.json(rede)
    }
  )
  .post(
    '/rede',
    requirePermission('rede', 'create'),
    zValidator(
      'json',
      z.object({
        nome: z.string().min(1).max(255)
      })
    ),
    async (c) => {
      const { nome } = c.req.valid('json')

      const [rede] = await db
        .insert(redeTable)
        .values({
          nome
        })
        .returning()
        .execute()

      return c.json(rede, 201)
    }
  )
  .put(
    '/rede/:idRede',
    requirePermission('rede', 'update'),
    zValidator(
      'param',
      z.object({
        idRede: z.coerce.number().min(1)
      })
    ),
    zValidator(
      'json',
      z.object({
        nome: z.string().min(1).max(255)
      })
    ),
    async (c) => {
      const { idRede } = c.req.valid('param')
      const { nome } = c.req.valid('json')

      const [existingRede] = await db
        .select()
        .from(redeTable)
        .where(and(eq(redeTable.id, idRede), isNull(redeTable.deletedAt)))
        .execute()

      if (!existingRede) return c.text('Rede não encontrada', 404)

      const [rede] = await db
        .update(redeTable)
        .set({
          nome
        })
        .where(eq(redeTable.id, idRede))
        .returning()
        .execute()

      return c.json(rede)
    }
  )
  .delete(
    '/rede/:idRede',
    requirePermission('rede', 'delete'),
    zValidator(
      'param',
      z.object({
        idRede: z.coerce.number().min(1)
      })
    ),
    async (c) => {
      const { idRede } = c.req.valid('param')

      const [existingRede] = await db
        .select()
        .from(redeTable)
        .where(and(eq(redeTable.id, idRede), isNull(redeTable.deletedAt)))
        .execute()

      if (!existingRede) return c.text('Rede não encontrada', 404)

      await db
        .update(redeTable)
        .set({
          deletedAt: new Date()
        })
        .where(eq(redeTable.id, idRede))
        .execute()

      return c.newResponse(null, 204)
    }
  )
