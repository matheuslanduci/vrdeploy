import { auth } from './auth'

export async function setupTest(role: 'user' | 'admin' = 'admin') {
  const { user } = await auth.api.createUser({
    body: {
      email: 'test@vrsoft.com.br',
      password: 'password',
      name: 'Test User',
      role
    }
  })

  const { headers } = await auth.api.signInEmail({
    returnHeaders: true,
    body: {
      email: 'test@vrsoft.com.br',
      password: 'password'
    }
  })

  return {
    user,
    headers: {
      cookie: headers.get('set-cookie') || ''
    }
  }
}
