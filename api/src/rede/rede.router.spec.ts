import { eq } from 'drizzle-orm'
import { db } from '~/database'
import { setupTest } from '~/test-utils'
import { redeRouter } from './rede.router'
import { redeTable } from './rede.sql'

describe('GET /rede', () => {
  it('should return 200 and an empty array when no redes exists', async () => {
    const { headers } = await setupTest()

    const response = await redeRouter.request('/rede', {
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

  it('should return 200 and an array of redes', async () => {
    const { headers } = await setupTest()

    const [rede] = await db
      .insert(redeTable)
      .values({
        nome: 'Rede Teste'
      })
      .returning()
      .execute()

    const response = await redeRouter.request('/rede', {
      method: 'GET',
      headers
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      data: [
        {
          ...rede!,
          createdAt: new Date(rede!.createdAt).toISOString(),
          updatedAt: new Date(rede!.updatedAt).toISOString()
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

  it('should return 200 and only non-deleted redes', async () => {
    const { headers } = await setupTest()

    await db
      .insert(redeTable)
      .values([
        { nome: 'Rede Ativa' },
        { nome: 'Rede Deletada', deletedAt: new Date() }
      ])
      .execute()

    const response = await redeRouter.request('/rede', {
      method: 'GET',
      headers
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      data: [
        {
          id: 1,
          nome: 'Rede Ativa',
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          ativo: true,
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

  it('should return 200 and paginated redes', async () => {
    for (let i = 1; i <= 30; i++) {
      await db
        .insert(redeTable)
        .values({ nome: `Rede ${i}` })
        .execute()
    }

    const { headers } = await setupTest()

    const response = await redeRouter.request('/rede?page=2&pageSize=10', {
      method: 'GET',
      headers
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      data: Array.from({ length: 10 }, (_, i) => ({
        id: i + 11,
        nome: `Rede ${i + 11}`,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        ativo: true,
        deletedAt: null
      })),
      meta: {
        page: 2,
        pageSize: 10,
        total: 30,
        totalPages: 3
      }
    })
  })
})

describe('GET /rede/:idRede', () => {
  it('should return 404 when the rede does not exist', async () => {
    const { headers } = await setupTest()

    const response = await redeRouter.request('/rede/1', {
      method: 'GET',
      headers
    })

    expect(response.status).toBe(404)
    expect(await response.text()).toBe('Rede não encontrada')
  })

  it('should return 404 when the rede is deleted', async () => {
    const { headers } = await setupTest()

    const [rede] = await db
      .insert(redeTable)
      .values({
        nome: 'Rede Teste',
        deletedAt: new Date()
      })
      .returning()
      .execute()

    const response = await redeRouter.request(`/rede/${rede!.id}`, {
      method: 'GET',
      headers
    })

    expect(response.status).toBe(404)
    expect(await response.text()).toBe('Rede não encontrada')
  })

  it('should return 200 and the rede when it exists', async () => {
    const { headers } = await setupTest()

    const [rede] = await db
      .insert(redeTable)
      .values({
        nome: 'Rede Teste'
      })
      .returning()
      .execute()

    const response = await redeRouter.request(`/rede/${rede!.id}`, {
      method: 'GET',
      headers
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      id: rede!.id,
      nome: rede!.nome,
      createdAt: new Date(rede!.createdAt).toISOString(),
      updatedAt: new Date(rede!.updatedAt).toISOString(),
      ativo: true,
      deletedAt: null
    })
  })
})

describe('POST /rede', () => {
  it('should return 201 and the created rede', async () => {
    const { headers } = await setupTest()

    const response = await redeRouter.request('/rede', {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nome: 'Rede Teste'
      })
    })

    expect(response.status).toBe(201)
    expect(await response.json()).toEqual({
      id: 1,
      nome: 'Rede Teste',
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      ativo: true,
      deletedAt: null
    })
  })
})

describe('PUT /rede/:idRede', () => {
  it('should return 404 when trying to update a non-existing rede', async () => {
    const { headers } = await setupTest()

    const response = await redeRouter.request('/rede/1', {
      method: 'PUT',
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nome: 'Rede Atualizada'
      })
    })

    expect(response.status).toBe(404)
    expect(await response.text()).toBe('Rede não encontrada')
  })

  it('should return 404 when trying to update a deleted rede', async () => {
    const { headers } = await setupTest()

    const [rede] = await db
      .insert(redeTable)
      .values({
        nome: 'Rede Teste',
        deletedAt: new Date()
      })
      .returning()
      .execute()

    const response = await redeRouter.request(`/rede/${rede!.id}`, {
      method: 'PUT',
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nome: 'Rede Atualizada'
      })
    })

    expect(response.status).toBe(404)
    expect(await response.text()).toBe('Rede não encontrada')
  })

  it('should return 200 and the updated rede', async () => {
    const { headers } = await setupTest()

    const [rede] = await db
      .insert(redeTable)
      .values({
        nome: 'Rede Teste'
      })
      .returning()
      .execute()

    const response = await redeRouter.request(`/rede/${rede!.id}`, {
      method: 'PUT',
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nome: 'Rede Atualizada'
      })
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      id: rede!.id,
      nome: 'Rede Atualizada',
      createdAt: new Date(rede!.createdAt).toISOString(),
      updatedAt: expect.any(String),
      ativo: true,
      deletedAt: null
    })
  })
})

describe('DELETE /rede/:idRede', () => {
  it('should return 404 when trying to delete a non-existing rede', async () => {
    const { headers } = await setupTest()

    const response = await redeRouter.request('/rede/1', {
      method: 'DELETE',
      headers
    })

    expect(response.status).toBe(404)
    expect(await response.text()).toBe('Rede não encontrada')
  })

  it('should return 404 when trying to delete a deleted rede', async () => {
    const { headers } = await setupTest()

    const [rede] = await db
      .insert(redeTable)
      .values({
        nome: 'Rede Teste',
        deletedAt: new Date()
      })
      .returning()
      .execute()

    const response = await redeRouter.request(`/rede/${rede!.id}`, {
      method: 'DELETE',
      headers
    })

    expect(response.status).toBe(404)
    expect(await response.text()).toBe('Rede não encontrada')
  })

  it('should return 204 and soft-delete the rede', async () => {
    const { headers } = await setupTest()

    const [rede] = await db
      .insert(redeTable)
      .values({
        nome: 'Rede Teste'
      })
      .returning()
      .execute()

    const response = await redeRouter.request(`/rede/${rede!.id}`, {
      method: 'DELETE',
      headers
    })

    expect(response.status).toBe(204)
    expect(await response.text()).toBe('')

    const [deletedRede] = await db
      .select()
      .from(redeTable)
      .where(eq(redeTable.id, rede!.id))
      .execute()

    expect(deletedRede).toBeDefined()
    expect(deletedRede!.deletedAt).toBeInstanceOf(Date)
  })
})
