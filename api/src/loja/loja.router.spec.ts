import { eq } from 'drizzle-orm'
import { db } from '~/database'
import { setupTest } from '~/test-utils'
import { redeTable } from '../rede/rede.sql'
import { lojaRouter } from './loja.router'
import { lojaTable } from './loja.sql'

describe('GET /loja', () => {
  it('should return 200 and an empty array when no lojas exists', async () => {
    const { headers } = await setupTest()

    const response = await lojaRouter.request('/loja', {
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

  it('should return 200 and an array of lojas', async () => {
    const { headers } = await setupTest()

    const [rede] = await db
      .insert(redeTable)
      .values({
        nome: 'Rede Teste'
      })
      .returning()
      .execute()

    const [loja] = await db
      .insert(lojaTable)
      .values({
        idRede: rede!.id,
        nome: 'Loja Teste'
      })
      .returning()
      .execute()

    const response = await lojaRouter.request('/loja', {
      method: 'GET',
      headers
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      data: [
        {
          ...loja!,
          createdAt: new Date(loja!.createdAt).toISOString(),
          updatedAt: new Date(loja!.updatedAt).toISOString()
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

  it('should return 200 and only non-deleted lojas', async () => {
    const { headers } = await setupTest()

    const [rede] = await db
      .insert(redeTable)
      .values({
        nome: 'Rede Teste'
      })
      .returning()
      .execute()

    await db
      .insert(lojaTable)
      .values([
        { idRede: rede!.id, nome: 'Loja Ativa' },
        { idRede: rede!.id, nome: 'Loja Deletada', deletedAt: new Date() }
      ])
      .execute()

    const response = await lojaRouter.request('/loja', {
      method: 'GET',
      headers
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      data: [
        {
          id: 1,
          idRede: rede!.id,
          nome: 'Loja Ativa',
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

  it('should return 200 and filter lojas by idRede', async () => {
    const { headers } = await setupTest()

    const [rede1] = await db
      .insert(redeTable)
      .values({
        nome: 'Rede 1'
      })
      .returning()
      .execute()

    const [rede2] = await db
      .insert(redeTable)
      .values({
        nome: 'Rede 2'
      })
      .returning()
      .execute()

    await db
      .insert(lojaTable)
      .values([
        { idRede: rede1!.id, nome: 'Loja Rede 1' },
        { idRede: rede2!.id, nome: 'Loja Rede 2' }
      ])
      .execute()

    const response = await lojaRouter.request(`/loja?idRede=${rede1!.id}`, {
      method: 'GET',
      headers
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      data: [
        {
          id: 1,
          idRede: rede1!.id,
          nome: 'Loja Rede 1',
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

  it('should return 200 and paginated lojas', async () => {
    const { headers } = await setupTest()

    const [rede] = await db
      .insert(redeTable)
      .values({
        nome: 'Rede Teste'
      })
      .returning()
      .execute()

    for (let i = 1; i <= 30; i++) {
      await db
        .insert(lojaTable)
        .values({ idRede: rede!.id, nome: `Loja ${i}` })
        .execute()
    }

    const response = await lojaRouter.request('/loja?page=2&pageSize=10', {
      method: 'GET',
      headers
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      data: Array.from({ length: 10 }, (_, i) => ({
        id: i + 11,
        idRede: rede!.id,
        nome: `Loja ${i + 11}`,
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

describe('GET /loja/:idLoja', () => {
  it('should return 404 when the loja does not exist', async () => {
    const { headers } = await setupTest()

    const response = await lojaRouter.request('/loja/1', {
      method: 'GET',
      headers
    })

    expect(response.status).toBe(404)
    expect(await response.text()).toBe('Loja não encontrada')
  })

  it('should return 404 when the loja is deleted', async () => {
    const { headers } = await setupTest()

    const [rede] = await db
      .insert(redeTable)
      .values({
        nome: 'Rede Teste'
      })
      .returning()
      .execute()

    const [loja] = await db
      .insert(lojaTable)
      .values({
        idRede: rede!.id,
        nome: 'Loja Teste',
        deletedAt: new Date()
      })
      .returning()
      .execute()

    const response = await lojaRouter.request(`/loja/${loja!.id}`, {
      method: 'GET',
      headers
    })

    expect(response.status).toBe(404)
    expect(await response.text()).toBe('Loja não encontrada')
  })

  it('should return 200 and the loja when it exists', async () => {
    const { headers } = await setupTest()

    const [rede] = await db
      .insert(redeTable)
      .values({
        nome: 'Rede Teste'
      })
      .returning()
      .execute()

    const [loja] = await db
      .insert(lojaTable)
      .values({
        idRede: rede!.id,
        nome: 'Loja Teste'
      })
      .returning()
      .execute()

    const response = await lojaRouter.request(`/loja/${loja!.id}`, {
      method: 'GET',
      headers
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      id: loja!.id,
      idRede: rede!.id,
      nome: loja!.nome,
      createdAt: new Date(loja!.createdAt).toISOString(),
      updatedAt: new Date(loja!.updatedAt).toISOString(),
      ativo: true,
      deletedAt: null
    })
  })
})

describe('POST /loja', () => {
  it('should return 404 when trying to create a loja with non-existing rede', async () => {
    const { headers } = await setupTest()

    const response = await lojaRouter.request('/loja', {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        idRede: 999,
        nome: 'Loja Teste'
      })
    })

    expect(response.status).toBe(404)
    expect(await response.text()).toBe('Rede não encontrada')
  })

  it('should return 404 when trying to create a loja with deleted rede', async () => {
    const { headers } = await setupTest()

    const [rede] = await db
      .insert(redeTable)
      .values({
        nome: 'Rede Teste',
        deletedAt: new Date()
      })
      .returning()
      .execute()

    const response = await lojaRouter.request('/loja', {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        idRede: rede!.id,
        nome: 'Loja Teste'
      })
    })

    expect(response.status).toBe(404)
    expect(await response.text()).toBe('Rede não encontrada')
  })

  it('should return 201 and the created loja', async () => {
    const { headers } = await setupTest()

    const [rede] = await db
      .insert(redeTable)
      .values({
        nome: 'Rede Teste'
      })
      .returning()
      .execute()

    const response = await lojaRouter.request('/loja', {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        idRede: rede!.id,
        nome: 'Loja Teste'
      })
    })

    expect(response.status).toBe(201)
    expect(await response.json()).toEqual({
      id: 1,
      idRede: rede!.id,
      nome: 'Loja Teste',
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      ativo: true,
      deletedAt: null
    })
  })
})

describe('PUT /loja/:idLoja', () => {
  it('should return 404 when trying to update a non-existing loja', async () => {
    const { headers } = await setupTest()

    const response = await lojaRouter.request('/loja/1', {
      method: 'PUT',
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        idRede: 1,
        nome: 'Loja Atualizada'
      })
    })

    expect(response.status).toBe(404)
    expect(await response.text()).toBe('Loja não encontrada')
  })

  it('should return 404 when trying to update a deleted loja', async () => {
    const { headers } = await setupTest()

    const [rede] = await db
      .insert(redeTable)
      .values({
        nome: 'Rede Teste'
      })
      .returning()
      .execute()

    const [loja] = await db
      .insert(lojaTable)
      .values({
        idRede: rede!.id,
        nome: 'Loja Teste',
        deletedAt: new Date()
      })
      .returning()
      .execute()

    const response = await lojaRouter.request(`/loja/${loja!.id}`, {
      method: 'PUT',
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        idRede: rede!.id,
        nome: 'Loja Atualizada'
      })
    })

    expect(response.status).toBe(404)
    expect(await response.text()).toBe('Loja não encontrada')
  })

  it('should return 404 when trying to update a loja with non-existing rede', async () => {
    const { headers } = await setupTest()

    const [rede] = await db
      .insert(redeTable)
      .values({
        nome: 'Rede Teste'
      })
      .returning()
      .execute()

    const [loja] = await db
      .insert(lojaTable)
      .values({
        idRede: rede!.id,
        nome: 'Loja Teste'
      })
      .returning()
      .execute()

    const response = await lojaRouter.request(`/loja/${loja!.id}`, {
      method: 'PUT',
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        idRede: 999,
        nome: 'Loja Atualizada'
      })
    })

    expect(response.status).toBe(404)
    expect(await response.text()).toBe('Rede não encontrada')
  })

  it('should return 404 when trying to update a loja with deleted rede', async () => {
    const { headers } = await setupTest()

    const [rede1] = await db
      .insert(redeTable)
      .values({
        nome: 'Rede 1'
      })
      .returning()
      .execute()

    const [rede2] = await db
      .insert(redeTable)
      .values({
        nome: 'Rede 2',
        deletedAt: new Date()
      })
      .returning()
      .execute()

    const [loja] = await db
      .insert(lojaTable)
      .values({
        idRede: rede1!.id,
        nome: 'Loja Teste'
      })
      .returning()
      .execute()

    const response = await lojaRouter.request(`/loja/${loja!.id}`, {
      method: 'PUT',
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        idRede: rede2!.id,
        nome: 'Loja Atualizada'
      })
    })

    expect(response.status).toBe(404)
    expect(await response.text()).toBe('Rede não encontrada')
  })

  it('should return 200 and the updated loja', async () => {
    const { headers } = await setupTest()

    const [rede1] = await db
      .insert(redeTable)
      .values({
        nome: 'Rede 1'
      })
      .returning()
      .execute()

    const [rede2] = await db
      .insert(redeTable)
      .values({
        nome: 'Rede 2'
      })
      .returning()
      .execute()

    const [loja] = await db
      .insert(lojaTable)
      .values({
        idRede: rede1!.id,
        nome: 'Loja Teste'
      })
      .returning()
      .execute()

    const response = await lojaRouter.request(`/loja/${loja!.id}`, {
      method: 'PUT',
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        idRede: rede2!.id,
        nome: 'Loja Atualizada'
      })
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      id: loja!.id,
      idRede: rede2!.id,
      nome: 'Loja Atualizada',
      createdAt: new Date(loja!.createdAt).toISOString(),
      updatedAt: expect.any(String),
      ativo: true,
      deletedAt: null
    })
  })
})

describe('DELETE /loja/:idLoja', () => {
  it('should return 404 when trying to delete a non-existing loja', async () => {
    const { headers } = await setupTest()

    const response = await lojaRouter.request('/loja/1', {
      method: 'DELETE',
      headers
    })

    expect(response.status).toBe(404)
    expect(await response.text()).toBe('Loja não encontrada')
  })

  it('should return 404 when trying to delete a deleted loja', async () => {
    const { headers } = await setupTest()

    const [rede] = await db
      .insert(redeTable)
      .values({
        nome: 'Rede Teste'
      })
      .returning()
      .execute()

    const [loja] = await db
      .insert(lojaTable)
      .values({
        idRede: rede!.id,
        nome: 'Loja Teste',
        deletedAt: new Date()
      })
      .returning()
      .execute()

    const response = await lojaRouter.request(`/loja/${loja!.id}`, {
      method: 'DELETE',
      headers
    })

    expect(response.status).toBe(404)
    expect(await response.text()).toBe('Loja não encontrada')
  })

  it('should return 204 and soft-delete the loja', async () => {
    const { headers } = await setupTest()

    const [rede] = await db
      .insert(redeTable)
      .values({
        nome: 'Rede Teste'
      })
      .returning()
      .execute()

    const [loja] = await db
      .insert(lojaTable)
      .values({
        idRede: rede!.id,
        nome: 'Loja Teste'
      })
      .returning()
      .execute()

    const response = await lojaRouter.request(`/loja/${loja!.id}`, {
      method: 'DELETE',
      headers
    })

    expect(response.status).toBe(204)
    expect(await response.text()).toBe('')

    const [deletedLoja] = await db
      .select()
      .from(lojaTable)
      .where(eq(lojaTable.id, loja!.id))
      .execute()

    expect(deletedLoja).toBeDefined()
    expect(deletedLoja!.deletedAt).toBeInstanceOf(Date)
  })
})
