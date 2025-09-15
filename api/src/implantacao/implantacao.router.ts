import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { zValidator } from '@hono/zod-validator'
import {
  and,
  count,
  desc,
  eq,
  getTableColumns,
  inArray,
  isNull
} from 'drizzle-orm'
import { Hono } from 'hono'
import z from 'zod'
import { agenteTable } from '~/agente/agente.sql'
import { requireAuth, requirePermission } from '~/auth'
import { db } from '~/database'
import { env } from '~/env'
import { implantacaoAgenteTable } from '~/implantacao-agente/implantacao-agente.sql'
import { isAgenteOnline, publisher } from '~/pubsub/pubsub'
import { s3 } from '~/s3'
import { assert } from '~/util/assert'
import { versaoTable } from '~/versao/versao.sql'
import { implantacaoTable } from './implantacao.sql'

export const implantacaoRouter = new Hono()

implantacaoRouter.get(
  '/implantacao',
  requireAuth(),
  requirePermission('agente', 'deploy'),
  zValidator(
    'query',
    z.object({
      page: z.coerce.number().min(1).default(1),
      pageSize: z.coerce.number().min(1).max(100).default(10)
    })
  ),
  async (c) => {
    const { page, pageSize } = c.req.valid('query')

    const whereConditions = and(isNull(implantacaoTable.deletedAt))

    const implantacoes = await db
      .select({
        ...getTableColumns(implantacaoTable),
        versao: getTableColumns(versaoTable)
      })
      .from(implantacaoTable)
      .leftJoin(versaoTable, eq(implantacaoTable.idVersao, versaoTable.id))
      .where(whereConditions)
      .orderBy(desc(implantacaoTable.id))
      .limit(pageSize)
      .offset((page - 1) * pageSize)
      .execute()
    const [total] = await db
      .select({
        count: count()
      })
      .from(implantacaoTable)
      .where(whereConditions)
      .execute()

    assert(total?.count !== undefined, 'Total count query failed')

    return c.json({
      data: implantacoes,
      meta: {
        page,
        pageSize,
        total: total.count,
        totalPages: Math.ceil(total.count / pageSize)
      }
    })
  }
)

implantacaoRouter.post(
  '/implantacao',
  requireAuth(),
  requirePermission('agente', 'deploy'),
  zValidator(
    'json',
    z.object({
      idVersao: z.number().int().min(1),
      idsAgentes: z.array(z.number().int().min(1)).min(1)
    })
  ),
  async (c) => {
    const { idVersao, idsAgentes } = c.req.valid('json')

    const [versao] = await db
      .select()
      .from(versaoTable)
      .where(and(eq(versaoTable.id, idVersao), isNull(versaoTable.deletedAt)))
      .limit(1)
      .execute()

    if (!versao) return c.text('Versão não encontrada', 404)

    // TODO: Check if versao has a file associated

    const agentes = await db
      .select()
      .from(agenteTable)
      .where(
        and(inArray(agenteTable.id, idsAgentes), isNull(agenteTable.deletedAt))
      )
      .execute()

    if (agentes.length !== idsAgentes.length)
      return c.text('Um ou mais agentes não foram encontrados', 404)

    const [implantacao] = await db
      .insert(implantacaoTable)
      .values({
        idVersao,
        status: 'em_andamento'
      })
      .returning()
      .execute()

    assert(implantacao, 'Erro ao criar a implantação')

    await db
      .insert(implantacaoAgenteTable)
      .values(
        agentes.map((agente) => ({
          idAgente: agente.id,
          idImplantacao: implantacao.id,
          status: 'em_andamento' as const
        }))
      )
      .execute()

    for (const agente of agentes) {
      // TODO: Se o agente não estiver online, adicionar a implantação a uma fila

      if (await isAgenteOnline(agente.id)) {
        const channel = `agente:${agente.id}:implantacao:created`

        const url = await getSignedUrl(
          s3,
          new GetObjectCommand({
            Bucket: env.S3_BUCKET,
            Key: versao.storageKey
          }),
          {
            expiresIn: 60 * 60 // 1 hour
          }
        )

        const message = {
          url,
          manifest: versao.manifest
        }

        await publisher.publish(channel, JSON.stringify(message))
      }
    }

    return c.json(implantacao, 201)
  }
)
