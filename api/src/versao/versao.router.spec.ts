import { db } from '~/database'
import { setupTest } from '~/test-utils'
import { versaoRouter } from './versao.router'
import { versaoTable } from './versao.sql'

vi.mock('@aws-sdk/lib-storage', () => ({
  Upload: class {
    constructor(public params: any) {}
    done = vi.fn().mockResolvedValue({})
    on = vi.fn()
  }
}))

describe('GET /versao', () => {
  it('should return 200 and an empty array when no versions exist', async () => {
    const { headers } = await setupTest()

    const response = await versaoRouter.request('/versao', {
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

  it('should return 200 and an array of versions', async () => {
    const { headers } = await setupTest()

    const [versao] = await db
      .insert(versaoTable)
      .values({
        semver: '1.0.0',
        descricao: 'Primeira versão',
        storageKey: 'versao-1.0.0',
        manifest: {
          version: '1.0.0',
          dependencies: []
        }
      })
      .returning()
      .execute()

    const response = await versaoRouter.request('/versao', {
      method: 'GET',
      headers
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      data: [
        {
          ...versao,
          filePresent: true,
          createdAt: versao!.createdAt.toISOString(),
          updatedAt: versao!.updatedAt.toISOString()
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

  it('should return 200 and only non-deleted versions', async () => {
    const { headers } = await setupTest()

    await db
      .insert(versaoTable)
      .values([
        {
          semver: '1.0.0',
          descricao: 'Versão ativa',
          storageKey: 'versao-1.0.0',
          manifest: {
            version: '1.0.0',
            dependencies: []
          }
        },
        {
          semver: '1.0.1',
          descricao: 'Versão deletada',
          storageKey: 'versao-1.0.1',
          manifest: {
            version: '1.0.1',
            dependencies: []
          },
          deletedAt: new Date()
        }
      ])
      .execute()

    const response = await versaoRouter.request('/versao', {
      method: 'GET',
      headers
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      data: [
        {
          id: expect.any(Number),
          semver: '1.0.0',
          descricao: 'Versão ativa',
          storageKey: 'versao-1.0.0',
          manifest: {
            version: '1.0.0',
            dependencies: []
          },
          filePresent: true,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          deletedAt: null
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

  it('should return 200 and paginated versions', async () => {
    const { headers } = await setupTest()

    // Criar 15 versões para testar paginação
    const versoes = Array.from({ length: 15 }, (_, i) => ({
      semver: `1.0.${i}`,
      descricao: `Versão ${i}`,
      storageKey: `versao-1.0.${i}`,
      manifest: {
        version: `1.0.${i}`,
        dependencies: []
      }
    }))

    await db.insert(versaoTable).values(versoes).execute()

    // Primeira página
    const response1 = await versaoRouter.request('/versao?page=1&pageSize=10', {
      method: 'GET',
      headers
    })

    expect(response1.status).toBe(200)
    const result1 = await response1.json()
    expect(result1.data).toHaveLength(10)
    expect(result1.meta).toEqual({
      page: 1,
      pageSize: 10,
      total: 15,
      totalPages: 2
    })

    // Segunda página
    const response2 = await versaoRouter.request('/versao?page=2&pageSize=10', {
      method: 'GET',
      headers
    })

    expect(response2.status).toBe(200)
    const result2 = await response2.json()
    expect(result2.data).toHaveLength(5)
    expect(result2.meta).toEqual({
      page: 2,
      pageSize: 10,
      total: 15,
      totalPages: 2
    })
  })

  it('should return versions with complex manifest structure', async () => {
    const { headers } = await setupTest()

    const complexManifest = {
      version: '2.0.0',
      dependencies: [
        {
          path: '/app/service1',
          ready: {
            type: 'http' as const,
            url: 'http://localhost:3000/health',
            status: 200
          }
        },
        {
          path: '/app/service2',
          ready: {
            type: 'grep' as const,
            expr: 'Server started'
          }
        },
        {
          path: '/app/service3',
          ready: {
            type: 'timeout' as const,
            seconds: 30
          },
          dependencies: [
            {
              path: '/app/service4',
              ready: {
                type: 'http',
                url: 'http://localhost:3000/health',
                status: 200
              }
            }
          ]
        }
      ]
    }

    const [versao] = await db
      .insert(versaoTable)
      .values({
        semver: '2.0.0',
        descricao: 'Versão com dependências complexas',
        storageKey: 'versao-2.0.0',
        manifest: complexManifest
      })
      .returning()
      .execute()

    const response = await versaoRouter.request('/versao', {
      method: 'GET',
      headers
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      data: [
        {
          ...versao,
          createdAt: versao!.createdAt.toISOString(),
          updatedAt: versao!.updatedAt.toISOString(),
          manifest: complexManifest,
          filePresent: true
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
})

describe('POST /versao', () => {
  it('should return 201 and the created version', async () => {
    const { headers } = await setupTest()

    const versionData = {
      semver: '1.0.0',
      descricao: 'Primeira versão',
      storageKey: expect.any(String),
      manifest: {
        version: '1.0.0',
        dependencies: []
      }
    }

    const response = await versaoRouter.request('/versao', {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(versionData)
    })

    expect(response.status).toBe(201)
    const result = await response.json()
    expect(result).toEqual({
      id: expect.any(Number),
      ...versionData,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      deletedAt: null
    })
  })
})

describe('GET /versao/:id', () => {
  it('should return 404 if version does not exist', async () => {
    const { headers } = await setupTest()

    const response = await versaoRouter.request('/versao/999', {
      method: 'GET',
      headers
    })

    expect(response.status).toBe(404)
    expect(await response.text()).toBe('Versão não encontrada')
  })

  it('should return 404 if version is deleted', async () => {
    const { headers } = await setupTest()

    const [versao] = await db
      .insert(versaoTable)
      .values({
        semver: '1.0.0',
        descricao: 'Versão deletada',
        storageKey: 'versao-1.0.0',
        manifest: {
          version: '1.0.0',
          dependencies: []
        },
        deletedAt: new Date()
      })
      .returning()
      .execute()

    const response = await versaoRouter.request(`/versao/${versao!.id}`, {
      method: 'GET',
      headers
    })

    expect(response.status).toBe(404)
    expect(await response.text()).toBe('Versão não encontrada')
  })

  it('should return 200 and the version data', async () => {
    const { headers } = await setupTest()

    const [versao] = await db
      .insert(versaoTable)
      .values({
        semver: '1.0.0',
        descricao: 'Primeira versão',
        storageKey: 'versao-1.0.0',
        manifest: {
          version: '1.0.0',
          dependencies: []
        }
      })
      .returning()
      .execute()

    const response = await versaoRouter.request(`/versao/${versao!.id}`, {
      method: 'GET',
      headers
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      ...versao,
      createdAt: versao!.createdAt.toISOString(),
      updatedAt: versao!.updatedAt.toISOString()
    })
  })
})

describe('POST /versao/:id/upload', () => {
  it('should return 400 if file is missing', async () => {
    const { headers } = await setupTest()

    const response = await versaoRouter.request('/versao/1/upload', {
      method: 'POST',
      headers
    })

    expect(response.status).toBe(400)
    expect(await response.text()).toBe('Arquivo inválido')
  })

  it('should return 400 if file is string', async () => {
    const { headers } = await setupTest()

    const formData = new FormData()
    formData.append('file', 'not-a-file')

    const response = await versaoRouter.request('/versao/1/upload', {
      method: 'POST',
      headers,
      body: formData
    })

    expect(response.status).toBe(400)
    expect(await response.text()).toBe('Arquivo inválido')
  })

  it('should return 400 if file is empty', async () => {
    const { headers } = await setupTest()

    const formData = new FormData()
    formData.append('file', new File([''], 'empty.txt'))

    const response = await versaoRouter.request('/versao/1/upload', {
      method: 'POST',
      headers,
      body: formData
    })

    expect(response.status).toBe(400)
    expect(await response.text()).toBe('Arquivo inválido')
  })

  it('should return 400 if file is not a zip', async () => {
    const { headers } = await setupTest()

    const formData = new FormData()
    formData.append(
      'file',
      new File(['content'], 'not-a-zip.txt', { type: 'text/plain' })
    )

    const response = await versaoRouter.request('/versao/1/upload', {
      method: 'POST',
      headers,
      body: formData
    })

    expect(response.status).toBe(400)
    expect(await response.text()).toBe('Arquivo inválido')
  })

  it('should return 404 if version does not exist', async () => {
    const { headers } = await setupTest()

    const formData = new FormData()
    formData.append(
      'file',
      new File(['content'], 'file.zip', { type: 'application/zip' })
    )

    const response = await versaoRouter.request('/versao/999/upload', {
      method: 'POST',
      headers,
      body: formData
    })

    expect(response.status).toBe(404)
    expect(await response.text()).toBe('Versão não encontrada')
  })

  it('should return 204 on successful upload', async () => {
    const { headers } = await setupTest()

    const [versao] = await db
      .insert(versaoTable)
      .values({
        semver: '1.0.0',
        descricao: 'Primeira versão',
        storageKey: 'versao-1.0.0.zip',
        manifest: {
          version: '1.0.0',
          dependencies: []
        }
      })
      .returning()
      .execute()

    const formData = new FormData()
    formData.append(
      'file',
      new File(['content'], 'file.zip', { type: 'application/zip' })
    )

    const response = await versaoRouter.request(
      `/versao/${versao!.id}/upload`,
      {
        method: 'POST',
        headers,
        body: formData
      }
    )

    expect(response.status).toBe(204)
  })
})

describe('PUT /versao/:id', () => {
  it('should return 404 if version does not exist', async () => {
    const { headers } = await setupTest()

    const response = await versaoRouter.request('/versao/999', {
      method: 'PUT',
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        semver: '1.0.0',
        descricao: 'Versão atualizada',
        manifest: {
          version: '1.0.0',
          dependencies: []
        }
      })
    })

    expect(response.status).toBe(404)
    expect(await response.text()).toBe('Versão não encontrada')
  })

  it('should return 404 if version is deleted', async () => {
    const { headers } = await setupTest()

    const [versao] = await db
      .insert(versaoTable)
      .values({
        semver: '1.0.0',
        descricao: 'Versão deletada',
        storageKey: 'versao-1.0.0',
        manifest: {
          version: '1.0.0',
          dependencies: []
        },
        deletedAt: new Date()
      })
      .returning()
      .execute()

    const response = await versaoRouter.request(`/versao/${versao!.id}`, {
      method: 'PUT',
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        semver: '1.0.0',
        descricao: 'Versão atualizada',
        manifest: {
          version: '1.0.0',
          dependencies: []
        }
      })
    })

    expect(response.status).toBe(404)
    expect(await response.text()).toBe('Versão não encontrada')
  })

  it('should return 200 and the updated version', async () => {
    const { headers } = await setupTest()

    const [versao] = await db
      .insert(versaoTable)
      .values({
        semver: '1.0.0',
        descricao: 'Versão original',
        storageKey: 'versao-1.0.0',
        manifest: {
          version: '1.0.0',
          dependencies: []
        }
      })
      .returning()
      .execute()

    const response = await versaoRouter.request(`/versao/${versao!.id}`, {
      method: 'PUT',
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        semver: '1.0.0',
        descricao: 'Versão atualizada',
        manifest: {
          version: '1.0.0',
          dependencies: []
        }
      })
    })

    expect(response.status).toBe(200)
    const result = await response.json()
    expect(result).toEqual({
      ...versao,
      descricao: 'Versão atualizada',
      createdAt: versao!.createdAt.toISOString(),
      updatedAt: expect.any(String)
    })
  })
})
