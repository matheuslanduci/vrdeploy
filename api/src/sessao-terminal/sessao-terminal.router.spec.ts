import { nanoid } from 'nanoid'
import { agenteTable } from '~/agente/agente.sql'
import { db } from '~/database'
import { setupTest } from '~/test-utils'
import { sessaoTerminalRouter } from './sessao-terminal.router'

describe('POST /sesao-terminal/:idAgente', () => {
  it('should return 404 if agente does not exist', async () => {
    const { headers } = await setupTest()

    const response = await sessaoTerminalRouter.request('/sessao-terminal/1', {
      method: 'POST',
      headers
    })

    expect(response.status).toBe(404)
    expect(await response.text()).toBe('Agente não encontrado')
  })

  it('should return 404 if agente is deleted', async () => {
    const { headers } = await setupTest()

    const [agente] = await db
      .insert(agenteTable)
      .values({
        chaveSecreta: nanoid(48),
        enderecoMac: '00:11:22:33:44:55',
        sistemaOperacional: 'Linux',
        situacao: 'pendente',
        deletedAt: new Date()
      })
      .returning()
      .execute()

    const response = await sessaoTerminalRouter.request(
      `/sessao-terminal/${agente!.id}`,
      {
        method: 'POST',
        headers
      }
    )

    expect(response.status).toBe(404)
    expect(await response.text()).toBe('Agente não encontrado')
  })

  it('should return 400 if agente is not approved', async () => {
    const { headers } = await setupTest()

    const [agente] = await db
      .insert(agenteTable)
      .values({
        chaveSecreta: nanoid(48),
        enderecoMac: '00:11:22:33:44:55',
        sistemaOperacional: 'Linux',
        situacao: 'pendente'
      })
      .returning()
      .execute()

    const response = await sessaoTerminalRouter.request(
      `/sessao-terminal/${agente!.id}`,
      {
        method: 'POST',
        headers
      }
    )

    expect(response.status).toBe(400)
    expect(await response.text()).toBe(
      'Sessão de terminal só pode ser iniciada para agentes aprovados e vinculados a um PDV'
    )
  })

  it('should return 400 if agente is not linked to a PDV', async () => {
    const { headers } = await setupTest()

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

    const response = await sessaoTerminalRouter.request(
      `/sessao-terminal/${agente!.id}`,
      {
        method: 'POST',
        headers
      }
    )

    expect(response.status).toBe(400)
    expect(await response.text()).toBe(
      'Sessão de terminal só pode ser iniciada para agentes aprovados e vinculados a um PDV'
    )
  })

  it('should return 201 and create a session', async () => {
    const { headers } = await setupTest()

    const [agente] = await db
      .insert(agenteTable)
      .values({
        chaveSecreta: nanoid(48),
        enderecoMac: '00:11:22:33:44:55',
        sistemaOperacional: 'Linux',
        situacao: 'aprovado',
        idPdv: 1
      })
      .returning()
      .execute()

    const response = await sessaoTerminalRouter.request(
      `/sessao-terminal/${agente!.id}`,
      {
        method: 'POST',
        headers
      }
    )

    expect(response.status).toBe(201)
    expect(await response.json()).toEqual({
      sessionId: expect.any(String)
    })
  })
})
