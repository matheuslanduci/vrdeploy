import { eq } from 'drizzle-orm'
import { db } from '~/database'
import { setupTest } from '~/test-utils'
import { lojaTable } from '../loja/loja.sql'
import { redeTable } from '../rede/rede.sql'
import { pdvRouter } from './pdv.router'
import { pdvTable } from './pdv.sql'

describe('GET /pdv', () => {
  it('should return 200 and an empty array when no pdvs exists', async () => {
    const { headers } = await setupTest()

    const response = await pdvRouter.request('/pdv', {
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

  it('should return 200 and an array of pdvs', async () => {
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

    const [pdv] = await db
      .insert(pdvTable)
      .values({
        idLoja: loja!.id,
        nome: 'PDV Teste'
      })
      .returning()
      .execute()

    const response = await pdvRouter.request('/pdv', {
      method: 'GET',
      headers
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      data: [
        {
          ...pdv!,
          createdAt: new Date(pdv!.createdAt).toISOString(),
          updatedAt: new Date(pdv!.updatedAt).toISOString(),
          loja: {
            ...loja!,
            createdAt: new Date(loja!.createdAt).toISOString(),
            updatedAt: new Date(loja!.updatedAt).toISOString()
          },
          rede: {
            ...rede!,
            createdAt: new Date(rede!.createdAt).toISOString(),
            updatedAt: new Date(rede!.updatedAt).toISOString()
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

  it('should return 200 and only non-deleted pdvs', async () => {
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

    await db
      .insert(pdvTable)
      .values([
        { idLoja: loja!.id, nome: 'PDV Ativo' },
        { idLoja: loja!.id, nome: 'PDV Deletado', deletedAt: new Date() }
      ])
      .execute()

    const response = await pdvRouter.request('/pdv', {
      method: 'GET',
      headers
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      data: [
        {
          id: 1,
          idLoja: loja!.id,
          nome: 'PDV Ativo',
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          ativo: true,
          deletedAt: null,
          loja: {
            id: loja!.id,
            idRede: rede!.id,
            nome: 'Loja Teste',
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            ativo: true,
            deletedAt: null
          },
          rede: {
            id: rede!.id,
            nome: 'Rede Teste',
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            ativo: true,
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

  it('should return 200 and filter pdvs by idLoja', async () => {
    const { headers } = await setupTest()

    const [rede] = await db
      .insert(redeTable)
      .values({
        nome: 'Rede Teste'
      })
      .returning()
      .execute()

    const [loja1] = await db
      .insert(lojaTable)
      .values({
        idRede: rede!.id,
        nome: 'Loja 1'
      })
      .returning()
      .execute()

    const [loja2] = await db
      .insert(lojaTable)
      .values({
        idRede: rede!.id,
        nome: 'Loja 2'
      })
      .returning()
      .execute()

    await db
      .insert(pdvTable)
      .values([
        { idLoja: loja1!.id, nome: 'PDV Loja 1' },
        { idLoja: loja2!.id, nome: 'PDV Loja 2' }
      ])
      .execute()

    const response = await pdvRouter.request(`/pdv?idLoja=${loja1!.id}`, {
      method: 'GET',
      headers
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      data: [
        {
          id: 1,
          idLoja: loja1!.id,
          nome: 'PDV Loja 1',
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          ativo: true,
          deletedAt: null,
          loja: {
            id: loja1!.id,
            idRede: rede!.id,
            nome: 'Loja 1',
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            ativo: true,
            deletedAt: null
          },
          rede: {
            id: rede!.id,
            nome: 'Rede Teste',
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            ativo: true,
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

  it('should return 200 and filter pdvs by idRede using left join', async () => {
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

    const [loja1] = await db
      .insert(lojaTable)
      .values({
        idRede: rede1!.id,
        nome: 'Loja Rede 1'
      })
      .returning()
      .execute()

    const [loja2] = await db
      .insert(lojaTable)
      .values({
        idRede: rede2!.id,
        nome: 'Loja Rede 2'
      })
      .returning()
      .execute()

    await db
      .insert(pdvTable)
      .values([
        { idLoja: loja1!.id, nome: 'PDV Rede 1' },
        { idLoja: loja2!.id, nome: 'PDV Rede 2' }
      ])
      .execute()

    const response = await pdvRouter.request(`/pdv?idRede=${rede1!.id}`, {
      method: 'GET',
      headers
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      data: [
        {
          id: 1,
          idLoja: loja1!.id,
          nome: 'PDV Rede 1',
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          ativo: true,
          deletedAt: null,
          loja: {
            id: loja1!.id,
            idRede: rede1!.id,
            nome: 'Loja Rede 1',
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            ativo: true,
            deletedAt: null
          },
          rede: {
            id: rede1!.id,
            nome: 'Rede 1',
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            ativo: true,
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

  it('should return 200 and filter pdvs by both idLoja and idRede', async () => {
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

    const [loja1] = await db
      .insert(lojaTable)
      .values({
        idRede: rede1!.id,
        nome: 'Loja 1 Rede 1'
      })
      .returning()
      .execute()

    const [loja2] = await db
      .insert(lojaTable)
      .values({
        idRede: rede1!.id,
        nome: 'Loja 2 Rede 1'
      })
      .returning()
      .execute()

    const [loja3] = await db
      .insert(lojaTable)
      .values({
        idRede: rede2!.id,
        nome: 'Loja 1 Rede 2'
      })
      .returning()
      .execute()

    await db
      .insert(pdvTable)
      .values([
        { idLoja: loja1!.id, nome: 'PDV Loja 1 Rede 1' },
        { idLoja: loja2!.id, nome: 'PDV Loja 2 Rede 1' },
        { idLoja: loja3!.id, nome: 'PDV Loja 1 Rede 2' }
      ])
      .execute()

    const response = await pdvRouter.request(
      `/pdv?idLoja=${loja1!.id}&idRede=${rede1!.id}`,
      {
        method: 'GET',
        headers
      }
    )

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      data: [
        {
          id: 1,
          idLoja: loja1!.id,
          nome: 'PDV Loja 1 Rede 1',
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          ativo: true,
          deletedAt: null,
          loja: {
            id: loja1!.id,
            idRede: rede1!.id,
            nome: 'Loja 1 Rede 1',
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            ativo: true,
            deletedAt: null
          },
          rede: {
            id: rede1!.id,
            nome: 'Rede 1',
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            ativo: true,
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

  it('should return 200 and paginated pdvs', async () => {
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

    for (let i = 1; i <= 30; i++) {
      await db
        .insert(pdvTable)
        .values({ idLoja: loja!.id, nome: `PDV ${i}` })
        .execute()
    }

    const response = await pdvRouter.request('/pdv?page=2&pageSize=10', {
      method: 'GET',
      headers
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      data: Array.from({ length: 10 }, (_, i) => ({
        id: i + 11,
        idLoja: loja!.id,
        nome: `PDV ${i + 11}`,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        ativo: true,
        deletedAt: null,
        loja: {
          id: loja!.id,
          idRede: rede!.id,
          nome: 'Loja Teste',
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          ativo: true,
          deletedAt: null
        },
        rede: {
          id: rede!.id,
          nome: 'Rede Teste',
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          ativo: true,
          deletedAt: null
        }
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

describe('GET /pdv/:idPdv', () => {
  it('should return 404 when the pdv does not exist', async () => {
    const { headers } = await setupTest()

    const response = await pdvRouter.request('/pdv/1', {
      method: 'GET',
      headers
    })

    expect(response.status).toBe(404)
    expect(await response.text()).toBe('PDV não encontrado')
  })

  it('should return 404 when the pdv is deleted', async () => {
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

    const [pdv] = await db
      .insert(pdvTable)
      .values({
        idLoja: loja!.id,
        nome: 'PDV Teste',
        deletedAt: new Date()
      })
      .returning()
      .execute()

    const response = await pdvRouter.request(`/pdv/${pdv!.id}`, {
      method: 'GET',
      headers
    })

    expect(response.status).toBe(404)
    expect(await response.text()).toBe('PDV não encontrado')
  })

  it('should return 200 and the pdv when it exists', async () => {
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

    const [pdv] = await db
      .insert(pdvTable)
      .values({
        idLoja: loja!.id,
        nome: 'PDV Teste'
      })
      .returning()
      .execute()

    const response = await pdvRouter.request(`/pdv/${pdv!.id}`, {
      method: 'GET',
      headers
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      id: pdv!.id,
      idLoja: loja!.id,
      nome: pdv!.nome,
      createdAt: new Date(pdv!.createdAt).toISOString(),
      updatedAt: new Date(pdv!.updatedAt).toISOString(),
      ativo: true,
      deletedAt: null
    })
  })
})

describe('POST /pdv', () => {
  it('should return 404 when trying to create a pdv with non-existing loja', async () => {
    const { headers } = await setupTest()

    const response = await pdvRouter.request('/pdv', {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        idLoja: 999,
        nome: 'PDV Teste'
      })
    })

    expect(response.status).toBe(404)
    expect(await response.text()).toBe('Loja não encontrada')
  })

  it('should return 404 when trying to create a pdv with deleted loja', async () => {
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

    const response = await pdvRouter.request('/pdv', {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        idLoja: loja!.id,
        nome: 'PDV Teste'
      })
    })

    expect(response.status).toBe(404)
    expect(await response.text()).toBe('Loja não encontrada')
  })

  it('should return 201 and the created pdv', async () => {
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

    const response = await pdvRouter.request('/pdv', {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        idLoja: loja!.id,
        nome: 'PDV Teste'
      })
    })

    expect(response.status).toBe(201)
    expect(await response.json()).toEqual({
      id: 1,
      idLoja: loja!.id,
      nome: 'PDV Teste',
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      ativo: true,
      deletedAt: null
    })
  })
})

describe('PUT /pdv/:idPdv', () => {
  it('should return 404 when trying to update a non-existing pdv', async () => {
    const { headers } = await setupTest()

    const response = await pdvRouter.request('/pdv/1', {
      method: 'PUT',
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        idLoja: 1,
        nome: 'PDV Atualizado'
      })
    })

    expect(response.status).toBe(404)
    expect(await response.text()).toBe('PDV não encontrado')
  })

  it('should return 404 when trying to update a deleted pdv', async () => {
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

    const [pdv] = await db
      .insert(pdvTable)
      .values({
        idLoja: loja!.id,
        nome: 'PDV Teste',
        deletedAt: new Date()
      })
      .returning()
      .execute()

    const response = await pdvRouter.request(`/pdv/${pdv!.id}`, {
      method: 'PUT',
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        idLoja: loja!.id,
        nome: 'PDV Atualizado'
      })
    })

    expect(response.status).toBe(404)
    expect(await response.text()).toBe('PDV não encontrado')
  })

  it('should return 404 when trying to update a pdv with non-existing loja', async () => {
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

    const [pdv] = await db
      .insert(pdvTable)
      .values({
        idLoja: loja!.id,
        nome: 'PDV Teste'
      })
      .returning()
      .execute()

    const response = await pdvRouter.request(`/pdv/${pdv!.id}`, {
      method: 'PUT',
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        idLoja: 999,
        nome: 'PDV Atualizado'
      })
    })

    expect(response.status).toBe(404)
    expect(await response.text()).toBe('Loja não encontrada')
  })

  it('should return 404 when trying to update a pdv with deleted loja', async () => {
    const { headers } = await setupTest()

    const [rede] = await db
      .insert(redeTable)
      .values({
        nome: 'Rede Teste'
      })
      .returning()
      .execute()

    const [loja1] = await db
      .insert(lojaTable)
      .values({
        idRede: rede!.id,
        nome: 'Loja 1'
      })
      .returning()
      .execute()

    const [loja2] = await db
      .insert(lojaTable)
      .values({
        idRede: rede!.id,
        nome: 'Loja 2',
        deletedAt: new Date()
      })
      .returning()
      .execute()

    const [pdv] = await db
      .insert(pdvTable)
      .values({
        idLoja: loja1!.id,
        nome: 'PDV Teste'
      })
      .returning()
      .execute()

    const response = await pdvRouter.request(`/pdv/${pdv!.id}`, {
      method: 'PUT',
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        idLoja: loja2!.id,
        nome: 'PDV Atualizado'
      })
    })

    expect(response.status).toBe(404)
    expect(await response.text()).toBe('Loja não encontrada')
  })

  it('should return 200 and the updated pdv', async () => {
    const { headers } = await setupTest()

    const [rede] = await db
      .insert(redeTable)
      .values({
        nome: 'Rede Teste'
      })
      .returning()
      .execute()

    const [loja1] = await db
      .insert(lojaTable)
      .values({
        idRede: rede!.id,
        nome: 'Loja 1'
      })
      .returning()
      .execute()

    const [loja2] = await db
      .insert(lojaTable)
      .values({
        idRede: rede!.id,
        nome: 'Loja 2'
      })
      .returning()
      .execute()

    const [pdv] = await db
      .insert(pdvTable)
      .values({
        idLoja: loja1!.id,
        nome: 'PDV Teste'
      })
      .returning()
      .execute()

    const response = await pdvRouter.request(`/pdv/${pdv!.id}`, {
      method: 'PUT',
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        idLoja: loja2!.id,
        nome: 'PDV Atualizado'
      })
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      id: pdv!.id,
      idLoja: loja2!.id,
      nome: 'PDV Atualizado',
      createdAt: new Date(pdv!.createdAt).toISOString(),
      updatedAt: expect.any(String),
      ativo: true,
      deletedAt: null
    })
  })
})

describe('DELETE /pdv/:idPdv', () => {
  it('should return 404 when trying to delete a non-existing pdv', async () => {
    const { headers } = await setupTest()

    const response = await pdvRouter.request('/pdv/1', {
      method: 'DELETE',
      headers
    })

    expect(response.status).toBe(404)
    expect(await response.text()).toBe('PDV não encontrado')
  })

  it('should return 404 when trying to delete a deleted pdv', async () => {
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

    const [pdv] = await db
      .insert(pdvTable)
      .values({
        idLoja: loja!.id,
        nome: 'PDV Teste',
        deletedAt: new Date()
      })
      .returning()
      .execute()

    const response = await pdvRouter.request(`/pdv/${pdv!.id}`, {
      method: 'DELETE',
      headers
    })

    expect(response.status).toBe(404)
    expect(await response.text()).toBe('PDV não encontrado')
  })

  it('should return 204 and soft-delete the pdv', async () => {
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

    const [pdv] = await db
      .insert(pdvTable)
      .values({
        idLoja: loja!.id,
        nome: 'PDV Teste'
      })
      .returning()
      .execute()

    const response = await pdvRouter.request(`/pdv/${pdv!.id}`, {
      method: 'DELETE',
      headers
    })

    expect(response.status).toBe(204)
    expect(await response.text()).toBe('')

    const [deletedPdv] = await db
      .select()
      .from(pdvTable)
      .where(eq(pdvTable.id, pdv!.id))
      .execute()

    expect(deletedPdv).toBeDefined()
    expect(deletedPdv!.deletedAt).toBeInstanceOf(Date)
  })
})
