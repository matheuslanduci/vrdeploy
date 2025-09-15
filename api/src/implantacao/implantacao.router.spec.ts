import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { agenteTable } from '~/agente/agente.sql'
import { db } from '~/database'
import { implantacaoAgenteTable } from '~/implantacao-agente/implantacao-agente.sql'
import { setupTest } from '~/test-utils'
import { versaoTable } from '~/versao/versao.sql'
import { implantacaoRouter } from './implantacao.router'
import { implantacaoTable } from './implantacao.sql'

describe('GET /implantacao', () => {
  it('should return 200 and an empty array when no implantacoes exist', async () => {
    const { headers } = await setupTest()

    const response = await implantacaoRouter.request('/implantacao', {
      method: 'GET',
      headers
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      data: [],
      meta: {
        page: 1,
        pageSize: 10,
        total: 0,
        totalPages: 0
      }
    })
  })

  it('should return 200 and an array of implantacoes', async () => {
    const { headers } = await setupTest()

    // Create versao first
    const [versao] = await db
      .insert(versaoTable)
      .values({
        semver: '1.0.0',
        descricao: 'Test version',
        storageKey: 'test-storage-key',
        manifest: {
          version: '1.0.0',
          dependencies: []
        }
      })
      .returning()
      .execute()

    // Create implantacao
    const [implantacao] = await db
      .insert(implantacaoTable)
      .values({
        idVersao: versao!.id,
        status: 'em_andamento'
      })
      .returning()
      .execute()

    const response = await implantacaoRouter.request('/implantacao', {
      method: 'GET',
      headers
    })

    expect(response.status).toBe(200)
    const result = await response.json()
    expect(result).toEqual({
      data: [
        {
          ...implantacao,
          createdAt: implantacao!.createdAt.toISOString(),
          updatedAt: implantacao!.updatedAt.toISOString(),
          deletedAt: null,
          versao: {
            ...versao,
            createdAt: versao!.createdAt.toISOString(),
            updatedAt: versao!.updatedAt.toISOString(),
            deletedAt: null
          }
        }
      ],
      meta: {
        page: 1,
        pageSize: 10,
        total: 1,
        totalPages: 1
      }
    })
  })

  it('should return 200 and only non-deleted implantacoes', async () => {
    const { headers } = await setupTest()

    // Create versao
    const [versao] = await db
      .insert(versaoTable)
      .values({
        semver: '1.0.0',
        descricao: 'Test version',
        storageKey: 'test-storage-key',
        manifest: {
          version: '1.0.0',
          dependencies: []
        }
      })
      .returning()
      .execute()

    // Create active implantacao
    const [activeImplantacao] = await db
      .insert(implantacaoTable)
      .values({
        idVersao: versao!.id,
        status: 'em_andamento'
      })
      .returning()
      .execute()

    // Create deleted implantacao
    await db
      .insert(implantacaoTable)
      .values({
        idVersao: versao!.id,
        status: 'concluido',
        deletedAt: new Date()
      })
      .execute()

    const response = await implantacaoRouter.request('/implantacao', {
      method: 'GET',
      headers
    })

    expect(response.status).toBe(200)
    const result = await response.json()
    expect(result.data).toHaveLength(1)
    expect(result.data[0].id).toBe(activeImplantacao!.id)
    expect(result.meta.total).toBe(1)
  })

  it('should handle pagination correctly', async () => {
    const { headers } = await setupTest()

    // Create versao
    const [versao] = await db
      .insert(versaoTable)
      .values({
        semver: '1.0.0',
        descricao: 'Test version',
        storageKey: 'test-storage-key',
        manifest: {
          version: '1.0.0',
          dependencies: []
        }
      })
      .returning()
      .execute()

    // Create multiple implantacoes
    await db
      .insert(implantacaoTable)
      .values([
        { idVersao: versao!.id, status: 'em_andamento' },
        { idVersao: versao!.id, status: 'concluido' },
        { idVersao: versao!.id, status: 'falha' }
      ])
      .execute()

    const response = await implantacaoRouter.request(
      '/implantacao?page=1&pageSize=2',
      {
        method: 'GET',
        headers
      }
    )

    expect(response.status).toBe(200)
    const result = await response.json()
    expect(result.data).toHaveLength(2)
    expect(result.meta).toEqual({
      page: 1,
      pageSize: 2,
      total: 3,
      totalPages: 2
    })
  })

  it('should validate query parameters', async () => {
    const { headers } = await setupTest()

    const response = await implantacaoRouter.request(
      '/implantacao?page=0&pageSize=101',
      {
        method: 'GET',
        headers
      }
    )

    expect(response.status).toBe(400)
  })

  it('should require authentication', async () => {
    const response = await implantacaoRouter.request('/implantacao', {
      method: 'GET'
    })

    expect(response.status).toBe(401)
  })

  it('should require proper permissions', async () => {
    const { headers } = await setupTest('user')

    const response = await implantacaoRouter.request('/implantacao', {
      method: 'GET',
      headers
    })

    expect(response.status).toBe(403)
  })
})

describe('POST /implantacao', () => {
  it('should create a new implantacao successfully', async () => {
    const { headers } = await setupTest()

    // Create versao
    const [versao] = await db
      .insert(versaoTable)
      .values({
        semver: '1.0.0',
        descricao: 'Test version',
        storageKey: 'test-storage-key',
        manifest: {
          version: '1.0.0',
          dependencies: []
        }
      })
      .returning()
      .execute()

    // Create agentes
    const [agente1] = await db
      .insert(agenteTable)
      .values({
        chaveSecreta: nanoid(48),
        enderecoMac: '00:11:22:33:44:55',
        sistemaOperacional: 'Linux',
        situacao: 'aprovado'
      })
      .returning()
      .execute()

    const [agente2] = await db
      .insert(agenteTable)
      .values({
        chaveSecreta: nanoid(48),
        enderecoMac: '00:11:22:33:44:56',
        sistemaOperacional: 'Windows',
        situacao: 'aprovado'
      })
      .returning()
      .execute()

    const response = await implantacaoRouter.request('/implantacao', {
      method: 'POST',
      headers: {
        ...headers,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        idVersao: versao!.id,
        idsAgentes: [agente1!.id, agente2!.id]
      })
    })

    expect(response.status).toBe(201)
    const result = await response.json()
    expect(result).toMatchObject({
      idVersao: versao!.id,
      status: 'em_andamento'
    })

    // Verify implantacao_agente records were created
    const implantacaoAgentes = await db
      .select()
      .from(implantacaoAgenteTable)
      .where(eq(implantacaoAgenteTable.idImplantacao, result.id))
      .execute()

    expect(implantacaoAgentes).toHaveLength(2)
    expect(implantacaoAgentes.every((ia) => ia.status === 'em_andamento')).toBe(
      true
    )
    expect(implantacaoAgentes.map((ia) => ia.idAgente).sort()).toEqual(
      [agente1!.id, agente2!.id].sort()
    )
  })

  it('should return 404 when versao does not exist', async () => {
    const { headers } = await setupTest()

    // Create agente
    const [agente] = await db
      .insert(agenteTable)
      .values({
        chaveSecreta: nanoid(48),
        enderecoMac: '00:11:22:33:44:55',
        sistemaOperacional: 'Linux',
        situacao: 'aprovado'
      })
      .returning()
      .execute()

    const response = await implantacaoRouter.request('/implantacao', {
      method: 'POST',
      headers: {
        ...headers,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        idVersao: 999999,
        idsAgentes: [agente!.id]
      })
    })

    expect(response.status).toBe(404)
    expect(await response.text()).toBe('Versão não encontrada')
  })

  it('should return 404 when versao is deleted', async () => {
    const { headers } = await setupTest()

    // Create deleted versao
    const [versao] = await db
      .insert(versaoTable)
      .values({
        semver: '1.0.0',
        descricao: 'Deleted version',
        storageKey: 'test-storage-key',
        manifest: {
          version: '1.0.0',
          dependencies: []
        },
        deletedAt: new Date()
      })
      .returning()
      .execute()

    // Create agente
    const [agente] = await db
      .insert(agenteTable)
      .values({
        chaveSecreta: nanoid(48),
        enderecoMac: '00:11:22:33:44:55',
        sistemaOperacional: 'Linux',
        situacao: 'aprovado'
      })
      .returning()
      .execute()

    const response = await implantacaoRouter.request('/implantacao', {
      method: 'POST',
      headers: {
        ...headers,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        idVersao: versao!.id,
        idsAgentes: [agente!.id]
      })
    })

    expect(response.status).toBe(404)
    expect(await response.text()).toBe('Versão não encontrada')
  })

  it('should return 404 when one or more agentes do not exist', async () => {
    const { headers } = await setupTest()

    // Create versao
    const [versao] = await db
      .insert(versaoTable)
      .values({
        semver: '1.0.0',
        descricao: 'Test version',
        storageKey: 'test-storage-key',
        manifest: {
          version: '1.0.0',
          dependencies: []
        }
      })
      .returning()
      .execute()

    // Create one agente
    const [agente] = await db
      .insert(agenteTable)
      .values({
        chaveSecreta: nanoid(48),
        enderecoMac: '00:11:22:33:44:55',
        sistemaOperacional: 'Linux',
        situacao: 'aprovado'
      })
      .returning()
      .execute()

    const response = await implantacaoRouter.request('/implantacao', {
      method: 'POST',
      headers: {
        ...headers,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        idVersao: versao!.id,
        idsAgentes: [agente!.id, 999999] // Non-existent agente
      })
    })

    expect(response.status).toBe(404)
    expect(await response.text()).toBe(
      'Um ou mais agentes não foram encontrados'
    )
  })

  it('should return 404 when one or more agentes are deleted', async () => {
    const { headers } = await setupTest()

    // Create versao
    const [versao] = await db
      .insert(versaoTable)
      .values({
        semver: '1.0.0',
        descricao: 'Test version',
        storageKey: 'test-storage-key',
        manifest: {
          version: '1.0.0',
          dependencies: []
        }
      })
      .returning()
      .execute()

    // Create active agente
    const [activeAgente] = await db
      .insert(agenteTable)
      .values({
        chaveSecreta: nanoid(48),
        enderecoMac: '00:11:22:33:44:55',
        sistemaOperacional: 'Linux',
        situacao: 'aprovado'
      })
      .returning()
      .execute()

    // Create deleted agente
    const [deletedAgente] = await db
      .insert(agenteTable)
      .values({
        chaveSecreta: nanoid(48),
        enderecoMac: '00:11:22:33:44:56',
        sistemaOperacional: 'Windows',
        situacao: 'aprovado',
        deletedAt: new Date()
      })
      .returning()
      .execute()

    const response = await implantacaoRouter.request('/implantacao', {
      method: 'POST',
      headers: {
        ...headers,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        idVersao: versao!.id,
        idsAgentes: [activeAgente!.id, deletedAgente!.id]
      })
    })

    expect(response.status).toBe(404)
    expect(await response.text()).toBe(
      'Um ou mais agentes não foram encontrados'
    )
  })

  it('should validate request body - missing idVersao', async () => {
    const { headers } = await setupTest()

    const response = await implantacaoRouter.request('/implantacao', {
      method: 'POST',
      headers: {
        ...headers,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        idsAgentes: [1]
      })
    })

    expect(response.status).toBe(400)
  })

  it('should validate request body - missing idsAgentes', async () => {
    const { headers } = await setupTest()

    const response = await implantacaoRouter.request('/implantacao', {
      method: 'POST',
      headers: {
        ...headers,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        idVersao: 1
      })
    })

    expect(response.status).toBe(400)
  })

  it('should validate request body - empty idsAgentes array', async () => {
    const { headers } = await setupTest()

    const response = await implantacaoRouter.request('/implantacao', {
      method: 'POST',
      headers: {
        ...headers,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        idVersao: 1,
        idsAgentes: []
      })
    })

    expect(response.status).toBe(400)
  })

  it('should validate request body - invalid idVersao type', async () => {
    const { headers } = await setupTest()

    const response = await implantacaoRouter.request('/implantacao', {
      method: 'POST',
      headers: {
        ...headers,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        idVersao: 'invalid',
        idsAgentes: [1]
      })
    })

    expect(response.status).toBe(400)
  })

  it('should validate request body - invalid idsAgentes type', async () => {
    const { headers } = await setupTest()

    const response = await implantacaoRouter.request('/implantacao', {
      method: 'POST',
      headers: {
        ...headers,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        idVersao: 1,
        idsAgentes: ['invalid']
      })
    })

    expect(response.status).toBe(400)
  })

  it('should require authentication', async () => {
    const response = await implantacaoRouter.request('/implantacao', {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        idVersao: 1,
        idsAgentes: [1]
      })
    })

    expect(response.status).toBe(401)
  })

  it('should require proper permissions', async () => {
    const { headers } = await setupTest('user')

    const response = await implantacaoRouter.request('/implantacao', {
      method: 'POST',
      headers: {
        ...headers,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        idVersao: 1,
        idsAgentes: [1]
      })
    })

    expect(response.status).toBe(403)
  })
})
