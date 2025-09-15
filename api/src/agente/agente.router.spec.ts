import { nanoid } from 'nanoid'
import { db } from '~/database'
import { createChannelName, pubsub } from '~/pubsub/pubsub'
import { setupTest } from '~/test-utils'
import { agenteRouter } from './agente.router'
import { agenteTable } from './agente.sql'

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

    const pubsubSpy = vi.spyOn(pubsub, 'publish')
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
      chaveSecreta: agente!.chaveSecreta,
      createdAt: agente!.createdAt.toISOString(),
      updatedAt: expect.any(String),
      deletedAt: null
    })
  })
})
