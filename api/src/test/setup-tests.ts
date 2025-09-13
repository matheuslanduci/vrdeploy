import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { auth } from '../auth'
import { db } from '../database'

beforeEach(async () => {
  await migrate(db, {
    migrationsFolder: './drizzle',
    migrationsSchema: 'public'
  })
})

afterEach(async () => {
  const tables = [
    '__drizzle_migrations',
    'user',
    'account',
    'session',
    'verification',
    'rede'
  ]

  for (const table of tables) {
    await db.execute(`drop table if exists "${table}"`)
  }
})

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
