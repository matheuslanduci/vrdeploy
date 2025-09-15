import { Hono } from 'hono'
import { nanoid } from 'nanoid'
import { agenteTable } from './agente/agente.sql'
import { auth, requireAgenteAuth, requireAuth, requirePermission } from './auth'
import { db } from './database'
import { setupTest } from './test-utils'

describe('requireAuth()', () => {
  const app = new Hono().use(requireAuth()).get('/protected', (c) => {
    return c.json({
      user: c.get('user')
    })
  })

  it('should return 401 if not authenticated', async () => {
    const response = await app.request('/protected', {
      method: 'GET'
    })

    expect(response.status).toBe(401)
    expect(await response.text()).toBe('Unauthorized')
  })

  it('should return 200 if authenticated', async () => {
    const { headers, user } = await setupTest()

    const response = await app.request('/protected', {
      method: 'GET',
      headers: {
        ...headers
      }
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      user: {
        ...user,
        createdAt: new Date(user.createdAt).toISOString(),
        updatedAt: new Date(user.updatedAt).toISOString()
      }
    })
  })
})

describe('requirePermission()', () => {
  const app = new Hono()
    .use(requireAuth())
    .use(requirePermission('rede', 'create', 'read', 'update', 'delete'))
    .get('/protected', (c) => {
      return c.json({
        user: c.get('user')
      })
    })

  it('should return 403 if user does not have permission', async () => {
    const { headers } = await setupTest('user')

    const response = await app.request('/protected', {
      method: 'GET',
      headers: {
        ...headers
      }
    })

    expect(response.status).toBe(403)
    expect(await response.text()).toBe('Forbidden')
  })

  it('should return 200 if user has permission', async () => {
    const { headers, user } = await setupTest('admin')

    const response = await app.request('/protected', {
      method: 'GET',
      headers: {
        ...headers
      }
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      user: {
        ...user,
        createdAt: new Date(user.createdAt).toISOString(),
        updatedAt: new Date(user.updatedAt).toISOString()
      }
    })
  })
})

describe('requireAgenteAuth()', () => {
  const app = new Hono().use(requireAgenteAuth()).get('/protected', (c) => {
    return c.json({
      agente: c.get('agente')
    })
  })

  it('should return 401 if not authenticated', async () => {
    const response = await app.request('/protected', {
      method: 'GET'
    })

    expect(response.status).toBe(401)
    expect(await response.text()).toBe('Unauthorized')
  })

  it('should return 401 if token is invalid', async () => {
    const response = await app.request('/protected', {
      method: 'GET',
      headers: {
        'X-Agente-Token': 'invalid-token'
      }
    })

    expect(response.status).toBe(401)
    expect(await response.text()).toBe('Unauthorized')
  })

  it('should return 401 if token is not ativo', async () => {
    const [agente] = await db
      .insert(agenteTable)
      .values({
        chaveSecreta: nanoid(48),
        enderecoMac: '00:00:00:00:00:00',
        idPdv: null,
        sistemaOperacional: 'test',
        ativo: false,
        situacao: 'pendente'
      })
      .returning()
      .execute()

    const response = await app.request('/protected', {
      method: 'GET',
      headers: {
        'X-Agente-Token': agente!.chaveSecreta
      }
    })

    expect(response.status).toBe(401)
    expect(await response.text()).toBe('Unauthorized')
  })

  it('should return 401 if token is deleted', async () => {
    const [agente] = await db
      .insert(agenteTable)
      .values({
        chaveSecreta: nanoid(48),
        enderecoMac: '00:00:00:00:00:00',
        idPdv: null,
        sistemaOperacional: 'test',
        ativo: true,
        deletedAt: new Date(),
        situacao: 'pendente'
      })
      .returning()
      .execute()

    const response = await app.request('/protected', {
      method: 'GET',
      headers: {
        'X-Agente-Token': agente!.chaveSecreta
      }
    })

    expect(response.status).toBe(401)
    expect(await response.text()).toBe('Unauthorized')
  })

  it('should return 200 if authenticated', async () => {
    const [agente] = await db
      .insert(agenteTable)
      .values({
        chaveSecreta: nanoid(48),
        enderecoMac: '00:00:00:00:00:00',
        idPdv: null,
        sistemaOperacional: 'test',
        situacao: 'pendente'
      })
      .returning()
      .execute()

    const response = await app.request('/protected', {
      method: 'GET',
      headers: {
        'X-Agente-Token': agente!.chaveSecreta
      }
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      agente: {
        ...agente,
        createdAt: new Date(agente!.createdAt).toISOString(),
        updatedAt: new Date(agente!.updatedAt).toISOString()
      }
    })
  })
})

describe('auth', () => {
  it('should not allow sign in with unapproved email domain', async () => {
    const app = new Hono().post('/api/auth/sign-in/email', (c) =>
      auth.handler(c.req.raw)
    )

    const response = await app.request('/api/auth/sign-in/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'anyemail@example.com',
        password: 'password'
      })
    })

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      code: 'Forbidden',
      message: 'Você não tem permissão para acessar esta aplicação'
    })
  })
})
