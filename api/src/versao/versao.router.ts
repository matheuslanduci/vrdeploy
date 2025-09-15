import { HeadObjectCommand } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { zValidator } from '@hono/zod-validator'
import { and, count, desc, eq, isNull } from 'drizzle-orm'
import { Hono } from 'hono'
import z from 'zod'
import { requireAuth, requirePermission } from '~/auth'
import { db } from '~/database'
import { env } from '~/env'
import { s3 } from '~/s3'
import { assert } from '~/util/assert'
import { versaoManifestSchema } from './versao'
import { versaoTable } from './versao.sql'

export const versaoRouter = new Hono()

versaoRouter.get(
  '/versao',
  requireAuth(),
  requirePermission('versao', 'read'),
  zValidator(
    'query',
    z.object({
      page: z.coerce.number().min(1).default(1),
      pageSize: z.coerce.number().min(1).max(100).default(10)
    })
  ),
  async (c) => {
    const { page, pageSize } = c.req.valid('query')

    const whereConditions = and(isNull(versaoTable.deletedAt))

    const versoes = await db
      .select()
      .from(versaoTable)
      .where(whereConditions)
      .orderBy(desc(versaoTable.id))
      .limit(pageSize)
      .offset((page - 1) * pageSize)
      .execute()
    const [total] = await db
      .select({
        count: count()
      })
      .from(versaoTable)
      .where(whereConditions)
      .execute()

    assert(total?.count !== undefined, 'Total count query failed')

    const versoesWithFiles = []

    for (const versao of versoes) {
      const present = await s3
        .send(
          new HeadObjectCommand({
            Bucket: env.S3_BUCKET,
            Key: versao.storageKey
          })
        )
        .catch(() => null)

      versoesWithFiles.push({ ...versao, filePresent: !!present })
    }

    return c.json({
      data: versoesWithFiles,
      meta: {
        page,
        pageSize,
        total: total.count,
        totalPages: Math.ceil(total.count / pageSize)
      }
    })
  }
)

versaoRouter.get(
  '/versao/:id',
  requireAuth(),
  requirePermission('versao', 'read'),
  zValidator(
    'param',
    z.object({
      id: z.coerce.number().min(1)
    })
  ),
  async (c) => {
    const { id } = c.req.valid('param')

    const [versao] = await db
      .select()
      .from(versaoTable)
      .where(and(eq(versaoTable.id, id), isNull(versaoTable.deletedAt)))
      .limit(1)
      .execute()

    if (!versao) return c.text('Versão não encontrada', 404)

    return c.json(versao)
  }
)

versaoRouter.post(
  '/versao',
  requireAuth(),
  requirePermission('versao', 'create'),
  zValidator(
    'json',
    z.object({
      semver: z.string().min(1).max(255),
      descricao: z.string().min(1).max(255),
      manifest: versaoManifestSchema
    })
  ),
  async (c) => {
    const { semver, descricao, manifest } = c.req.valid('json')

    const [versao] = await db
      .insert(versaoTable)
      .values({
        semver,
        descricao,
        storageKey: `vrdeploy/versao-${semver}/${Date.now()}.zip`,
        manifest
      })
      .returning()
      .execute()

    return c.json(versao, 201)
  }
)

versaoRouter.post(
  '/versao/:id/upload',
  requireAuth(),
  requirePermission('versao', 'update'),
  zValidator(
    'param',
    z.object({
      id: z.coerce.number().min(1)
    })
  ),
  async (c) => {
    const { id } = c.req.valid('param')

    const body = await c.req.parseBody()

    if (
      !body?.file ||
      typeof body.file === 'string' ||
      (body.file instanceof File && body.file.size === 0) ||
      (body.file instanceof File && !body.file.name.endsWith('.zip'))
    )
      return c.text('Arquivo inválido', 400)

    const [versao] = await db
      .select()
      .from(versaoTable)
      .where(and(eq(versaoTable.id, id), isNull(versaoTable.deletedAt)))
      .limit(1)
      .execute()

    if (!versao) return c.text('Versão não encontrada', 404)

    const upload = new Upload({
      client: s3,
      params: {
        Bucket: env.S3_BUCKET,
        Key: versao.storageKey,
        Body: body.file.stream(),
        ContentType: 'application/zip'
      }
    })

    await upload.done()

    return c.newResponse(null, 204)
  }
)

versaoRouter.put(
  '/versao/:id',
  requireAuth(),
  requirePermission('versao', 'update'),
  zValidator(
    'param',
    z.object({
      id: z.coerce.number().min(1)
    })
  ),
  zValidator(
    'json',
    z.object({
      semver: z.string().min(1).max(255),
      descricao: z.string().min(1).max(255),
      manifest: versaoManifestSchema
    })
  ),
  async (c) => {
    const { id } = c.req.valid('param')
    const { semver, descricao, manifest } = c.req.valid('json')

    const [versao] = await db
      .select()
      .from(versaoTable)
      .where(and(eq(versaoTable.id, id), isNull(versaoTable.deletedAt)))
      .limit(1)
      .execute()

    if (!versao) return c.text('Versão não encontrada', 404)

    const [updatedVersao] = await db
      .update(versaoTable)
      .set({
        semver,
        descricao,
        manifest,
        updatedAt: new Date()
      })
      .where(eq(versaoTable.id, id))
      .returning()
      .execute()

    return c.json(updatedVersao)
  }
)
