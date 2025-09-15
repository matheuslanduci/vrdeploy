import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { db } from '~/database'
import { lojaTable } from '~/loja/loja.sql'
import { pdvTable } from '~/pdv/pdv.sql'
import { createChannelName, publisher } from '~/pubsub/pubsub'
import { redeTable } from '~/rede/rede.sql'
import { redis } from '~/redis'
import { setupTest } from '~/test-utils'
import { agenteRouter } from './agente.router'
import { agenteTable } from './agente.sql'

describe('GET /agente', () => {
  it('should return 200 and an empty array when no agents exist', async () => {
    const { headers } = await setupTest()

    const response = await agenteRouter.request('/agente', {
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

  it('should return 200 and an array of agents', async () => {
    const { headers } = await setupTest()

    vi.spyOn(redis, 'get').mockResolvedValue(null)

    const [agente] = await db
      .insert(agenteTable)
      .values({
        chaveSecreta: nanoid(48),
        situacao: 'pendente',
        enderecoMac: '00:1A:2B:3C:4D:5E',
        sistemaOperacional: 'Linux'
      })
      .returning({
        id: agenteTable.id,
        idPdv: agenteTable.idPdv,
        enderecoMac: agenteTable.enderecoMac,
        sistemaOperacional: agenteTable.sistemaOperacional,
        ativo: agenteTable.ativo,
        situacao: agenteTable.situacao,
        createdAt: agenteTable.createdAt,
        updatedAt: agenteTable.updatedAt,
        deletedAt: agenteTable.deletedAt
      })
      .execute()

    const response = await agenteRouter.request('/agente', {
      method: 'GET',
      headers
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      data: [
        {
          ...agente,
          createdAt: agente!.createdAt.toISOString(),
          updatedAt: expect.any(String),
          online: false,
          loja: null,
          pdv: null,
          rede: null
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

  it('should return 200 and only non-deleted agents', async () => {
    const { headers } = await setupTest()

    vi.spyOn(redis, 'get').mockResolvedValue(null)

    await db
      .insert(agenteTable)
      .values([
        {
          chaveSecreta: nanoid(48),
          situacao: 'pendente',
          enderecoMac: '00:1A:2B:3C:4D:5E',
          sistemaOperacional: 'Linux'
        },
        {
          chaveSecreta: nanoid(48),
          situacao: 'pendente',
          enderecoMac: '00:1A:2B:3C:4D:5E',
          sistemaOperacional: 'Linux',
          deletedAt: new Date()
        }
      ])
      .execute()

    const response = await agenteRouter.request('/agente', {
      method: 'GET',
      headers
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      data: [
        {
          id: expect.any(Number),
          idPdv: null,
          enderecoMac: '00:1A:2B:3C:4D:5E',
          sistemaOperacional: 'Linux',
          ativo: true,
          situacao: 'pendente',
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          deletedAt: null,
          online: false,
          loja: null,
          pdv: null,
          rede: null
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

  it('should return 200 and filter by idPdv', async () => {
    const { headers } = await setupTest()

    vi.spyOn(redis, 'get').mockResolvedValue(null)

    const [pdv1, pdv2] = await db
      .insert(pdvTable)
      .values([
        {
          idLoja: 1,
          nome: 'PDV 1'
        },
        {
          idLoja: 1,
          nome: 'PDV 2'
        }
      ])
      .returning()
      .execute()

    const [agente1] = await db
      .insert(agenteTable)
      .values([
        {
          chaveSecreta: nanoid(48),
          situacao: 'pendente',
          enderecoMac: '00:1A:2B:3C:4D:5E',
          sistemaOperacional: 'Linux',
          idPdv: pdv1!.id
        },
        {
          chaveSecreta: nanoid(48),
          situacao: 'pendente',
          enderecoMac: '00:1A:2B:3C:4D:5F',
          sistemaOperacional: 'Linux',
          idPdv: pdv2!.id
        }
      ])
      .returning({
        id: agenteTable.id,
        idPdv: agenteTable.idPdv,
        enderecoMac: agenteTable.enderecoMac,
        sistemaOperacional: agenteTable.sistemaOperacional,
        ativo: agenteTable.ativo,
        situacao: agenteTable.situacao,
        createdAt: agenteTable.createdAt,
        updatedAt: agenteTable.updatedAt,
        deletedAt: agenteTable.deletedAt
      })
      .execute()

    const response = await agenteRouter.request(`/agente?idPdv=${pdv1!.id}`, {
      method: 'GET',
      headers
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      data: [
        {
          ...agente1,
          createdAt: agente1!.createdAt.toISOString(),
          updatedAt: expect.any(String),
          online: false,
          loja: null,
          pdv: {
            ...pdv1,
            createdAt: pdv1!.createdAt.toISOString(),
            updatedAt: pdv1!.updatedAt.toISOString()
          },
          rede: null
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

  it('should return 200 and filter by idLoja', async () => {
    const { headers } = await setupTest()

    vi.spyOn(redis, 'get').mockResolvedValue(null)

    const [loja1, loja2] = await db
      .insert(lojaTable)
      .values([
        {
          idRede: 1,
          nome: 'Loja 1'
        },
        {
          idRede: 1,
          nome: 'Loja 2'
        }
      ])
      .returning()
      .execute()

    const [pdv1, pdv2] = await db
      .insert(pdvTable)
      .values([
        {
          idLoja: 1,
          nome: 'PDV 1'
        },
        {
          idLoja: 2,
          nome: 'PDV 2'
        }
      ])
      .returning()
      .execute()

    const [agente1] = await db
      .insert(agenteTable)
      .values([
        {
          chaveSecreta: nanoid(48),
          situacao: 'pendente',
          enderecoMac: '00:1A:2B:3C:4D:5E',
          sistemaOperacional: 'Linux',
          idPdv: pdv1!.id
        },
        {
          chaveSecreta: nanoid(48),
          situacao: 'pendente',
          enderecoMac: '00:1A:2B:3C:4D:5F',
          sistemaOperacional: 'Linux',
          idPdv: pdv2!.id
        }
      ])
      .returning({
        id: agenteTable.id,
        idPdv: agenteTable.idPdv,
        enderecoMac: agenteTable.enderecoMac,
        sistemaOperacional: agenteTable.sistemaOperacional,
        ativo: agenteTable.ativo,
        situacao: agenteTable.situacao,
        createdAt: agenteTable.createdAt,
        updatedAt: agenteTable.updatedAt,
        deletedAt: agenteTable.deletedAt
      })
      .execute()

    const response = await agenteRouter.request(
      `/agente?idLoja=${pdv1!.idLoja}`,
      {
        method: 'GET',
        headers
      }
    )

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      data: [
        {
          ...agente1,
          createdAt: agente1!.createdAt.toISOString(),
          updatedAt: expect.any(String),
          online: false,
          loja: {
            ...loja1,
            createdAt: loja1!.createdAt.toISOString(),
            updatedAt: loja1!.updatedAt.toISOString()
          },
          pdv: {
            ...pdv1,
            createdAt: pdv1!.createdAt.toISOString(),
            updatedAt: pdv1!.updatedAt.toISOString()
          },
          rede: null
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

  it('should return 200 and filter by idRede', async () => {
    const { headers } = await setupTest()

    vi.spyOn(redis, 'get').mockResolvedValue(null)

    const [rede1, rede2] = await db
      .insert(redeTable)
      .values([
        {
          nome: 'Rede 1'
        },
        {
          nome: 'Rede 2'
        }
      ])
      .returning()
      .execute()

    const [loja1, loja2] = await db
      .insert(lojaTable)
      .values([
        {
          idRede: rede1!.id,
          nome: 'Loja 1'
        },
        {
          idRede: rede2!.id,
          nome: 'Loja 2'
        }
      ])
      .returning()
      .execute()

    const [pdv1, pdv2] = await db
      .insert(pdvTable)
      .values([
        {
          idLoja: loja1!.id,
          nome: 'PDV 1'
        },
        {
          idLoja: loja2!.id,
          nome: 'PDV 2'
        }
      ])
      .returning()
      .execute()

    const [agente1] = await db
      .insert(agenteTable)
      .values([
        {
          chaveSecreta: nanoid(48),
          situacao: 'pendente',
          enderecoMac: '00:1A:2B:3C:4D:5E',
          sistemaOperacional: 'Linux',
          idPdv: pdv1!.id
        },
        {
          chaveSecreta: nanoid(48),
          situacao: 'pendente',
          enderecoMac: '00:1A:2B:3C:4D:5F',
          sistemaOperacional: 'Linux',
          idPdv: pdv2!.id
        }
      ])
      .returning({
        id: agenteTable.id,
        idPdv: agenteTable.idPdv,
        enderecoMac: agenteTable.enderecoMac,
        sistemaOperacional: agenteTable.sistemaOperacional,
        ativo: agenteTable.ativo,
        situacao: agenteTable.situacao,
        createdAt: agenteTable.createdAt,
        updatedAt: agenteTable.updatedAt,
        deletedAt: agenteTable.deletedAt
      })
      .execute()

    const response = await agenteRouter.request(
      `/agente?idRede=${loja1!.idRede}`,
      {
        method: 'GET',
        headers
      }
    )

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      data: [
        {
          ...agente1,
          createdAt: agente1!.createdAt.toISOString(),
          updatedAt: expect.any(String),
          online: false,
          loja: {
            ...loja1,
            createdAt: loja1!.createdAt.toISOString(),
            updatedAt: loja1!.updatedAt.toISOString()
          },
          pdv: {
            ...pdv1,
            createdAt: pdv1!.createdAt.toISOString(),
            updatedAt: pdv1!.updatedAt.toISOString()
          },
          rede: {
            ...rede1,
            createdAt: rede1!.createdAt.toISOString(),
            updatedAt: rede1!.updatedAt.toISOString()
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
})

describe('POST /agente', () => {
  it('should return 201 and the created agent', async () => {
    const response = await agenteRouter.request('/agente', {
      method: 'POST',
      body: JSON.stringify({
        enderecoMac: '00:1A:2B:3C:4D:5E',
        sistemaOperacional: 'Linux'
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    })

    expect(response.status).toBe(201)
    expect(await response.json()).toEqual({
      id: expect.any(Number),
      idPdv: null,
      enderecoMac: '00:1A:2B:3C:4D:5E',
      sistemaOperacional: 'Linux',
      ativo: true,
      situacao: 'pendente',
      chaveSecreta: expect.any(String),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      deletedAt: null
    })
  })
})

describe('PATCH /agente/:id', () => {
  it('should return 404 if agent does not exist', async () => {
    const { headers } = await setupTest()

    const response = await agenteRouter.request('/agente/1', {
      method: 'PATCH',
      body: JSON.stringify({
        situacao: 'aprovado'
      }),
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      }
    })

    expect(response.status).toBe(404)
    expect(await response.text()).toBe('Agente não encontrado')
  })

  it('should return 404 if agent is deleted', async () => {
    const [agente] = await db
      .insert(agenteTable)
      .values({
        chaveSecreta: nanoid(48),
        situacao: 'pendente',
        enderecoMac: '00:1A:2B:3C:4D:5E',
        sistemaOperacional: 'Linux',
        deletedAt: new Date()
      })
      .returning()
      .execute()

    const { headers } = await setupTest()

    const response = await agenteRouter.request(`/agente/${agente!.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        situacao: 'aprovado'
      }),
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      }
    })

    expect(response.status).toBe(404)
    expect(await response.text()).toBe('Agente não encontrado')
  })

  it('should return 400 if agent is not pending', async () => {
    const [agente] = await db
      .insert(agenteTable)
      .values({
        chaveSecreta: nanoid(48),
        situacao: 'aprovado',
        enderecoMac: '00:1A:2B:3C:4D:5E',
        sistemaOperacional: 'Linux'
      })
      .returning()
      .execute()

    const { headers } = await setupTest()

    const response = await agenteRouter.request(`/agente/${agente!.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        situacao: 'rejeitado'
      }),
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      }
    })

    expect(response.status).toBe(400)
    expect(await response.text()).toBe('Agente já foi avaliado')
  })

  it('should publish event when agent is approved', async () => {
    const [agente] = await db
      .insert(agenteTable)
      .values({
        chaveSecreta: nanoid(48),
        situacao: 'pendente',
        enderecoMac: '00:1A:2B:3C:4D:5E',
        sistemaOperacional: 'Linux'
      })
      .returning()
      .execute()

    const pubsubSpy = vi.spyOn(publisher, 'publish')
    const channel = createChannelName(agente!.id, 'agente:updated')

    const { headers } = await setupTest()

    await agenteRouter.request(`/agente/${agente!.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        situacao: 'aprovado'
      }),
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      }
    })

    expect(pubsubSpy).toHaveBeenCalledWith(channel, expect.any(String))
  })

  it('should return 200 and the updated agent', async () => {
    const [agente] = await db
      .insert(agenteTable)
      .values({
        chaveSecreta: nanoid(48),
        situacao: 'pendente',
        enderecoMac: '00:1A:2B:3C:4D:5E',
        sistemaOperacional: 'Linux'
      })
      .returning()
      .execute()

    const { headers } = await setupTest()

    const response = await agenteRouter.request(`/agente/${agente!.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        situacao: 'aprovado'
      }),
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      }
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      id: agente!.id,
      idPdv: null,
      enderecoMac: '00:1A:2B:3C:4D:5E',
      sistemaOperacional: 'Linux',
      ativo: true,
      situacao: 'aprovado',
      createdAt: agente!.createdAt.toISOString(),
      updatedAt: expect.any(String),
      deletedAt: null
    })
  })
})

describe('DELETE /agente/:id', () => {
  it('should return 404 if agent does not exist', async () => {
    const { headers } = await setupTest()

    const response = await agenteRouter.request('/agente/1', {
      method: 'DELETE',
      headers
    })

    expect(response.status).toBe(404)
    expect(await response.text()).toBe('Agente não encontrado')
  })

  it('should return 404 if agent is deleted', async () => {
    const [agente] = await db
      .insert(agenteTable)
      .values({
        chaveSecreta: nanoid(48),
        situacao: 'pendente',
        enderecoMac: '00:1A:2B:3C:4D:5E',
        sistemaOperacional: 'Linux',
        deletedAt: new Date()
      })
      .returning()
      .execute()

    const { headers } = await setupTest()

    const response = await agenteRouter.request(`/agente/${agente!.id}`, {
      method: 'DELETE',
      headers
    })

    expect(response.status).toBe(404)
    expect(await response.text()).toBe('Agente não encontrado')
  })

  it('should return 400 if agent is not rejected', async () => {
    const [agente] = await db
      .insert(agenteTable)
      .values({
        chaveSecreta: nanoid(48),
        situacao: 'aprovado',
        enderecoMac: '00:1A:2B:3C:4D:5E',
        sistemaOperacional: 'Linux'
      })
      .returning()
      .execute()

    const { headers } = await setupTest()

    const response = await agenteRouter.request(`/agente/${agente!.id}`, {
      method: 'DELETE',
      headers
    })

    expect(response.status).toBe(400)
    expect(await response.text()).toBe(
      'Apenas agentes com situação rejeitado podem ser excluídos'
    )
  })

  it('should return 204 and delete the agent', async () => {
    const [agente] = await db
      .insert(agenteTable)
      .values({
        chaveSecreta: nanoid(48),
        situacao: 'rejeitado',
        enderecoMac: '00:1A:2B:3C:4D:5E',
        sistemaOperacional: 'Linux'
      })
      .returning()
      .execute()

    const { headers } = await setupTest()

    const response = await agenteRouter.request(`/agente/${agente!.id}`, {
      method: 'DELETE',
      headers
    })

    expect(response.status).toBe(204)
    expect(await response.text()).toBe('')

    const [deletedAgente] = await db
      .select()
      .from(agenteTable)
      .where(eq(agenteTable.id, agente!.id))
      .execute()

    expect(deletedAgente!.deletedAt).toBeInstanceOf(Date)
  })
})
