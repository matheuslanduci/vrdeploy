import { zValidator } from '@hono/zod-validator'
import { asc, count, isNull } from 'drizzle-orm'
import { Hono } from 'hono'
import z from 'zod'
import { requireAuth } from '~/auth'
import { db } from '~/database'
import { redeTable } from './rede.sql'

export const redeRouter = new Hono().use(requireAuth()).get(
  '/rede',
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

    return c.json({
      data: redes,
      meta: {
        page,
        pageSize,
        total: Number(total?.count ?? 0),
        totalPages: Math.ceil(Number(total?.count ?? 0) / pageSize)
      }
    })
  }
)
